import { randomUUID } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";

import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/access", () => ({ requireAccess: vi.fn(() => Promise.resolve("admin")) }));
vi.mock("@/db", async () => {
  const { drizzle } = await import("drizzle-orm/pglite");
  const client = new PGlite();
  const db = drizzle(client);
  return { db: Object.assign(db, { batch: async (queries: PromiseLike<unknown>[]) => {
    await client.exec("BEGIN");
    try { for (const query of queries) await query; await client.exec("COMMIT"); }
    catch (error) { await client.exec("ROLLBACK"); throw error; }
  } }), testClient: client };
});

import { addFridgeProduct, saveInventory } from "@/lib/actions/inventory";
import { archiveDuplicate } from "@/lib/actions/product-duplicates";
import { reviewProductMatch, setProductArchived } from "@/lib/actions/product-matching";
import { requireAccess } from "@/lib/auth/access";
import { getFridgeInventory, getInventoryHistory, searchInventoryProducts } from "@/lib/queries/inventory";
import { getInvoiceFormData } from "@/lib/queries/invoices";
import { getDuplicateProducts } from "@/lib/queries/product-duplicates";
import { getProductMatching } from "@/lib/queries/product-matching";
import { getProviderWithProducts } from "@/lib/queries/providers";

let client: PGlite;
const source = randomUUID(), target = randomUUID(), fridge = randomUUID(), provider = randomUUID();
beforeAll(async () => {
  const databaseModule = await import("@/db");
  const value: unknown = Reflect.get(databaseModule, "testClient");
  if (!(value instanceof PGlite)) throw new Error("Missing isolated database");
  client = value;
  for (const migration of readdirSync("drizzle").filter(n => n.endsWith(".sql")).sort()) await client.exec(`BEGIN;${readFileSync(`drizzle/${migration}`, "utf8")};COMMIT;`);
  const unit = (await client.query<{ id: string }>("SELECT id FROM unidades WHERE codigo='unidad'")).rows[0]?.id;
  await client.query("INSERT INTO productos(id,nombre,unidad_id) VALUES ($1,'Kassler',$3),($2,'Kasler',$3)", [source, target, unit]);
  await client.query("INSERT INTO heladeras(id,numero) VALUES ($1,1);", [fridge]);
  await client.query("INSERT INTO heladera_productos(heladera_id,producto_id) VALUES ($1,$2)", [fridge, source]);
  await client.query("INSERT INTO proveedores(id,nombre) VALUES ($1,'Supplier')", [provider]);
  await client.query("INSERT INTO proveedor_productos(proveedor_id,producto_id,precio) VALUES ($1,$2,20)", [provider, target]);
  await saveInventory({ fridgeId: fridge, counts: [{ productId: source, quantity: "5" }] });
}, 30000);
afterAll(async () => { await client.close(); });
it("archives globally, preserves history and links, rejects stale writes and restores original IDs", async () => {
  expect(await reviewProductMatch({ inventoryId: source, catalogueId: target, status: "accepted" })).toEqual({ ok: true, data: undefined });
  const observations = (await client.query("SELECT * FROM observaciones_inventario")).rows;
  const links = (await client.query("SELECT * FROM proveedor_productos")).rows;
  expect(await setProductArchived({ productId: source, archived: true })).toEqual({ ok: true, data: undefined });
  expect(await getFridgeInventory(fridge)).toEqual([]);
  expect(await searchInventoryProducts("Kassler")).toEqual([]);
  expect((await getInventoryHistory(1)).rows.some(r => r.name === "Kassler")).toBe(true);
  expect((await saveInventory({ fridgeId: fridge, counts: [{ productId: source, quantity: "6" }] })).ok).toBe(false);
  expect((await addFridgeProduct({ fridgeId: fridge, productId: source })).ok).toBe(false);
  expect((await reviewProductMatch({ inventoryId: source, catalogueId: target, status: "accepted" })).ok).toBe(false);
  const archivedSource = (await getProductMatching()).inventory.find(p => p.id === source);
  expect(archivedSource?.deletedAt).not.toBeNull();
  expect(await setProductArchived({ productId: target, archived: true })).toEqual({ ok: true, data: undefined });
  expect((await getProviderWithProducts(provider))?.products).toEqual([]);
  expect((await getInvoiceFormData()).find(p => p.id === provider)?.products).toEqual([]);
  expect((await client.query("SELECT * FROM observaciones_inventario")).rows).toEqual(observations);
  expect((await client.query("SELECT * FROM proveedor_productos")).rows).toEqual(links);
  expect((await client.query("SELECT estado FROM equivalencias_productos")).rows).toEqual([{ estado: "accepted" }]);
  await setProductArchived({ productId: source, archived: false });
  await setProductArchived({ productId: target, archived: false });
  expect((await getFridgeInventory(fridge))[0]?.id).toBe(source);
  expect((await getProviderWithProducts(provider))?.products[0]?.id).toBe(target);
  expect((await getProductMatching()).decisions[0]?.status).toBe("accepted");
});
it("requires Admin authorization before archiving or reviewing", async () => {
  vi.mocked(requireAccess).mockRejectedValueOnce(new Error("Denied"));
  await expect(setProductArchived({ productId: source, archived: true })).rejects.toThrow("Denied");
  expect((await client.query("SELECT eliminado_at FROM productos WHERE id=$1", [source])).rows).toEqual([{ eliminado_at: null }]);
  vi.mocked(requireAccess).mockRejectedValueOnce(new Error("Denied"));
  await expect(reviewProductMatch({ inventoryId: source, catalogueId: target, status: "accepted" })).rejects.toThrow("Denied");
});
it("reviews duplicates against active IDs, preserves observations and links, and restores", async () => {
  const before = (await client.query("SELECT * FROM observaciones_inventario")).rows;
  expect((await archiveDuplicate({ keepId: source, archiveId: source })).ok).toBe(false);
  expect((await archiveDuplicate({ keepId: randomUUID(), archiveId: source })).ok).toBe(false);
  expect(await archiveDuplicate({ keepId: target, archiveId: source })).toEqual({ ok: true, data: undefined });
  expect((await getDuplicateProducts()).find(p => p.id === source)).toMatchObject({ observations: before.length, placements: [{ number: 1, note: null, active: true }] });
  expect((await getDuplicateProducts()).find(p => p.id === source)?.deletedAt).not.toBeNull();
  expect((await getDuplicateProducts()).find(p => p.id === target)?.providers[0]?.id).toBe(provider);
  expect((await archiveDuplicate({ keepId: source, archiveId: target })).ok).toBe(false);
  expect((await client.query("SELECT * FROM observaciones_inventario")).rows).toEqual(before);
  await setProductArchived({ productId: source, archived: false });
  expect((await getFridgeInventory(fridge))[0]?.id).toBe(source);
  vi.mocked(requireAccess).mockRejectedValueOnce(new Error("Denied"));
  await expect(archiveDuplicate({ keepId: target, archiveId: source })).rejects.toThrow("Denied");
});
