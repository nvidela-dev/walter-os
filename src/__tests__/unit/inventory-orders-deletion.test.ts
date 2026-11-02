import { createHash, randomUUID } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";

import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";

const actor = vi.hoisted((): { id: string; role: "admin" | "waitress" | "kitchen" } => ({ id: "owner", role: "admin" }));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/access", async () => {
  const { canAccess } = await import("@/lib/auth/policy");
  return { requireAccess: async (area: "main" | "drinks" | "inventory") => { if (!canAccess(actor.role, area)) throw new Error("Denied"); return actor.id; }, getCurrentGroup: () => Promise.resolve(actor.role), getCurrentActorName: () => Promise.resolve(actor.id) };
});
vi.mock("@/db", async () => { const { drizzle } = await import("drizzle-orm/pglite"); const client = new PGlite(); return { db: drizzle(client), testClient: client }; });

import { deleteSavedInventory } from "@/lib/actions/delete-inventory";
import { createDrinkDocument, saveDrinkDocument } from "@/lib/actions/drink-documents";
import { getDrinkPurchases } from "@/lib/queries/drink-purchases";

import { inventoryBootstrapSql } from "../../../scripts/inventory-bootstrap";

let client: PGlite;
const product = randomUUID(), drink = randomUUID(), provider = randomUUID(), fridge = randomUUID();
beforeAll(async () => {
  const value: unknown = Reflect.get(await import("@/db"), "testClient");
  if (!(value instanceof PGlite)) throw new Error("Missing db");
  client = value;
  for (const file of readdirSync("drizzle").filter(name => name.endsWith(".sql")).sort()) await client.exec(readFileSync(`drizzle/${file}`, "utf8"));
  await client.query("INSERT INTO productos(id,nombre,unidad) VALUES($1,'Cerveza','botella')", [product]);
  await client.query("INSERT INTO inventario_bebidas_productos(id,producto_id,ubicacion,categoria,unidad_conteo,cantidad_objetivo,unidad_objetivo) VALUES($1,$2,'Bar','Cervezas','botella',10,'botella')", [drink, product]);
  await client.query("INSERT INTO proveedores(id,nombre,tipo) VALUES($1,'Proveedor A','producto')", [provider]);
  await client.query("INSERT INTO proveedor_productos(proveedor_id,producto_id) VALUES($1,$2)", [provider, product]);
  await client.query("INSERT INTO heladeras(id,numero) VALUES($1,900)", [fridge]);
  await client.query("INSERT INTO heladera_productos(heladera_id,producto_id) VALUES($1,$2)", [fridge, product]);
}, 30000);
beforeEach(() => { actor.id = "owner"; actor.role = "admin"; });
afterAll(async () => { await client.close(); });

it("builds provider shortages from the selected dated document, keeping unknowns unresolved", async () => {
  const created = await createDrinkDocument("Cervezas", "2026-10-18");
  if (!created.ok) throw new Error(created.error);
  expect((await getDrinkPurchases(created.data.id))?.products[0]?.comparison.shortage).toBeNull();
  await saveDrinkDocument(created.data.id, 0, [{ itemId: drink, quantity: "3", unit: "botella" }]);
  const report = await getDrinkPurchases(created.data.id);
  expect(report?.products[0]).toMatchObject({ comparison: { stock: "3", target: "10", shortage: "7" }, suppliers: [{ id: provider, name: "Proveedor A" }] });
});

it("guards drinks deletion by owner and revision, removes only the selected file, and allows recreation", async () => {
  const created = await createDrinkDocument("Cervezas", "2026-10-17");
  if (!created.ok) throw new Error(created.error);
  await saveDrinkDocument(created.data.id, 0, [{ itemId: drink, quantity: "0", unit: "botella" }]);
  actor.id = "other"; actor.role = "waitress";
  expect((await deleteSavedInventory("drinks", created.data.id, "1")).ok).toBe(false);
  actor.id = "owner";
  expect((await deleteSavedInventory("drinks", created.data.id, "0")).ok).toBe(false);
  expect((await deleteSavedInventory("drinks", created.data.id, "1")).ok).toBe(true);
  expect((await client.query("SELECT * FROM ediciones_documentos_bebidas WHERE documento_id=$1", [created.data.id])).rows).toHaveLength(0);
  const again = await createDrinkDocument("Cervezas", "2026-10-17");
  expect(again.ok && again.data.id !== created.data.id).toBe(true);
  expect((await client.query("SELECT * FROM productos WHERE id=$1", [product])).rows).toHaveLength(1);
});

it("deletes a food week and its counts only after revision confirmation, preserving other weeks and targets", async () => {
  await client.query("INSERT INTO observaciones_inventario(heladera_id,producto_id,cantidad,unidad,registrado_por,registrado_at) VALUES($1,$2,4,'botella','owner','2026-10-06T12:00:00Z'),($1,$2,6,'botella','owner','2026-10-13T12:00:00Z')", [fridge, product]);
  const run = (await client.query<{id: number}>("SELECT id FROM inventarios WHERE fecha='2026-10-06'")).rows[0];
  if (!run) throw new Error("Missing run");
  const row = (await client.query<{token: string}>("SELECT md5(coalesce(string_agg(observacion_id::text,',' ORDER BY observacion_id),'')) token FROM inventario_items WHERE inventario_id=$1", [run.id])).rows[0];
  expect((await deleteSavedInventory("food", String(run.id), createHash("md5").update("").digest("hex"))).ok).toBe(false);
  actor.role = "kitchen";
  expect((await deleteSavedInventory("food", String(run.id), row?.token ?? "")).ok).toBe(false);
  actor.role = "admin";
  expect((await deleteSavedInventory("food", String(run.id), row?.token ?? "")).ok).toBe(true);
  expect((await client.query("SELECT * FROM inventarios WHERE fecha='2026-10-13'")).rows).toHaveLength(1);
  expect((await client.query("SELECT * FROM observaciones_inventario")).rows).toHaveLength(1);
  expect((await client.query("SELECT cambio FROM inventario_items")).rows[0]).toEqual({ cambio: null });
  await expect(client.exec("DELETE FROM observaciones_inventario")).rejects.toThrow("append-only");
});

it("bootstrap is repeatable and fails closed on partially installed deletion functions", async () => {
  await client.exec(inventoryBootstrapSql());
  await client.exec(inventoryBootstrapSql());
  await client.exec("DROP FUNCTION public.delete_inventory_run(bigint,text)");
  await expect(client.exec(inventoryBootstrapSql())).rejects.toThrow("Partial inventory deletion");
});
