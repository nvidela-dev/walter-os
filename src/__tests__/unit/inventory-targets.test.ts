import { randomUUID } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";

import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/access", () => ({ requireAccess: vi.fn(() => Promise.resolve("admin_one")) }));
vi.mock("@/db", async () => {
  const { drizzle } = await import("drizzle-orm/pglite");
  const client = new PGlite();
  return { db: drizzle(client), testClient: client };
});

import { expectedActionError } from "@/lib/action-result";
import { setInventoryTarget } from "@/lib/actions/inventory-targets";
import { requireAccess } from "@/lib/auth/access";
import { getInventoryTargetHistory, getInventoryTargetProduct } from "@/lib/queries/inventory-targets";

let client: PGlite;
const productId = randomUUID();
const secondProduct = randomUUID();
const fridgeId = randomUUID();

beforeAll(async () => {
  const databaseModule = await import("@/db");
  const value: unknown = Reflect.get(databaseModule, "testClient");
  if (!(value instanceof PGlite)) throw new Error("Missing isolated database");
  client = value;
  for (const file of readdirSync("drizzle").filter((name) => name.endsWith(".sql")).sort()) {
    await client.exec(`BEGIN;${readFileSync(`drizzle/${file}`, "utf8")};COMMIT;`);
  }
  await client.query("INSERT INTO productos(id,nombre,unidad) VALUES ($1,'Arroz','kg'),($2,'Sal','kg')", [productId, secondProduct]);
  await client.query("INSERT INTO heladeras(id,numero) VALUES ($1,1)", [fridgeId]);
  await client.query("INSERT INTO heladera_productos(heladera_id,producto_id) VALUES ($1,$2),($1,$3)", [fridgeId, productId, secondProduct]);
}, 30000);
afterAll(async () => { await client.close(); });

it("starts without fabricated targets, saves revisions, and advances one active target without changing counts", async () => {
  expect((await getInventoryTargetProduct(productId))?.target).toBeNull();
  expect((await setInventoryTarget({ productId, quantity: "12" })).ok).toBe(true);
  vi.mocked(requireAccess).mockResolvedValueOnce("admin_two");
  expect((await setInventoryTarget({ productId, quantity: "8.50" })).ok).toBe(true);
  expect(vi.mocked(requireAccess)).toHaveBeenCalledWith("main");
  const active = await getInventoryTargetProduct(productId);
  expect(active?.target).toMatchObject({ quantity: "8.50", unit: "kg" });
  const history = await getInventoryTargetHistory(productId);
  expect(history.revisions.map((row) => [row.quantity, row.unit, row.recordedBy])).toEqual([["8.50", "kg", "admin_two"], ["12.00", "kg", "admin_one"]]);
  expect((await client.query("SELECT * FROM objetivos_inventario_activos WHERE producto_id=$1", [productId])).rows).toHaveLength(1);
  expect((await client.query("SELECT * FROM observaciones_inventario")).rows).toHaveLength(0);
  await client.query("UPDATE productos SET unidad='unidad' WHERE id=$1", [productId]);
  expect((await getInventoryTargetProduct(productId))?.target?.unit).toBe("kg");
  expect((await setInventoryTarget({ productId, quantity: "0" })).ok).toBe(true);
  expect((await getInventoryTargetProduct(productId))?.target).toMatchObject({ quantity: "0.00", unit: "unidad" });
  expect((await getInventoryTargetHistory(productId)).revisions).toHaveLength(3);
});

it("protects history, rejects cross-product active pointers, and refuses invalid or unplaced products", async () => {
  await expect(client.query("UPDATE historial_objetivos_inventario SET cantidad=99 WHERE producto_id=$1", [productId])).rejects.toThrow("append-only");
  await expect(client.query("DELETE FROM historial_objetivos_inventario WHERE producto_id=$1", [productId])).rejects.toThrow("append-only");
  const targetId = (await getInventoryTargetProduct(productId))?.target?.id;
  await expect(client.query("INSERT INTO objetivos_inventario_activos(producto_id,objetivo_id) VALUES ($1,$2)", [secondProduct, targetId])).rejects.toThrow();
  for (const quantity of ["", "-1", "1.234", "10000000000", "NaN"]) expect((await setInventoryTarget({ productId, quantity })).ok).toBe(false);
  const unplaced = randomUUID();
  await client.query("INSERT INTO productos(id,nombre,unidad) VALUES ($1,'Not in inventory','kg')", [unplaced]);
  expect((await setInventoryTarget({ productId: unplaced, quantity: "5" })).ok).toBe(false);
  await client.query("UPDATE heladera_productos SET activo=false WHERE producto_id=$1", [secondProduct]);
  expect((await setInventoryTarget({ productId: secondProduct, quantity: "5" })).ok).toBe(false);
  expect((await getInventoryTargetHistory(productId)).revisions).toHaveLength(3);
});

it("allows authorized reads but denies Kitchen and unauthenticated target writes before changing history", async () => {
  vi.mocked(requireAccess).mockRejectedValueOnce(expectedActionError("Denied"));
  expect((await setInventoryTarget({ productId, quantity: "7" })).ok).toBe(false);
  expect((await getInventoryTargetProduct(productId))?.target?.quantity).toBe("0.00");
  vi.mocked(requireAccess).mockRejectedValueOnce(expectedActionError("Denied"));
  await expect(getInventoryTargetHistory(productId)).rejects.toThrow("Denied");
  await expect(getInventoryTargetHistory(productId, -1)).rejects.toThrow("Invalid target history page");
});

it("paginates target revisions and never reactivates an older identity", async () => {
  await client.query("INSERT INTO historial_objetivos_inventario(producto_id,cantidad,unidad,registrado_por) SELECT $1,n,'unidad','admin' FROM generate_series(1,22) n", [productId]);
  const first = await getInventoryTargetHistory(productId);
  const second = await getInventoryTargetHistory(productId, 2);
  expect(first.revisions).toHaveLength(20);
  expect(first.hasNext).toBe(true);
  expect([...first.revisions, ...second.revisions]).toHaveLength(25);
  const active = (await getInventoryTargetProduct(productId))?.target;
  expect(active?.quantity).toBe("22.00");
  await client.query("INSERT INTO historial_objetivos_inventario(id,producto_id,cantidad,unidad,registrado_por) OVERRIDING SYSTEM VALUE VALUES (0,$1,1,'unidad','admin')", [productId]);
  expect((await getInventoryTargetProduct(productId))?.target?.id).toBe(active?.id);
});

it("calculates purchases from the latest run, the active target, and active fridge placements without multiplying supplier links", async () => {
  const { getInventoryPurchases } = await import("@/lib/queries/inventory-purchases");
  const { groupInventoryPurchases } = await import("@/lib/inventory/purchases");
  const rice = randomUUID();
  const fridgeTwo = randomUUID();
  const supplierA = randomUUID();
  const supplierB = randomUUID();
  await client.query("INSERT INTO productos(id,nombre,unidad) VALUES ($1,'Purchase rice','kg')", [rice]);
  await client.query("INSERT INTO heladeras(id,numero) VALUES ($1,2)", [fridgeTwo]);
  await client.query("INSERT INTO heladera_productos(heladera_id,producto_id) VALUES ($1,$3),($2,$3)", [fridgeId, fridgeTwo, rice]);
  await client.query("INSERT INTO proveedores(id,nombre) VALUES ($1,'Supplier A'),($2,'Supplier B')", [supplierA, supplierB]);
  await client.query("INSERT INTO proveedor_productos(proveedor_id,producto_id,precio,cantidad) VALUES ($1,$3,50,6),($2,$3,40,4)", [supplierA, supplierB, rice]);
  await setInventoryTarget({ productId: rice, quantity: "12" });
  async function count(fridge: string, quantity: number, day: string): Promise<void> {
    await client.query("INSERT INTO observaciones_inventario(heladera_id,producto_id,cantidad,unidad,registrado_por,registrado_at) VALUES ($1,$2,$3,'kg','kitchen',$4)", [fridge, rice, quantity, day]);
  }
  await count(fridgeId, 3, "2026-10-06T12:00:00Z");
  let purchases = await getInventoryPurchases();
  expect(purchases.products.find((row) => row.id === rice)?.comparison).toMatchObject({ stock: null, shortage: null, issues: ["missing-count"] });
  await count(fridgeTwo, 5, "2026-10-09T12:00:00Z");
  purchases = await getInventoryPurchases();
  expect(purchases.day).toBe("2026-10-06");
  const line = purchases.products.find((row) => row.id === rice);
  expect(line?.comparison).toMatchObject({ stock: "8", target: "12.00", shortage: "4", issues: [] });
  expect(line?.suppliers).toHaveLength(2);
  expect(groupInventoryPurchases(purchases.products, {}).unresolved.some((row) => row.id === rice)).toBe(true);
  expect(groupInventoryPurchases(purchases.products, { [rice]: supplierB }).groups.find((group) => group.supplier.id === supplierB)?.products).toHaveLength(1);
  await setInventoryTarget({ productId: rice, quantity: "10" });
  expect((await getInventoryPurchases()).products.find((row) => row.id === rice)?.comparison.shortage).toBe("2");
  await count(fridgeId, 0, "2026-10-13T12:00:00Z");
  expect((await getInventoryPurchases()).products.find((row) => row.id === rice)?.comparison.shortage).toBeNull();
  await client.query("UPDATE heladera_productos SET activo=false WHERE heladera_id=$1 AND producto_id=$2", [fridgeTwo, rice]);
  expect((await getInventoryPurchases()).products.find((row) => row.id === rice)?.comparison).toMatchObject({ stock: "0", shortage: "10" });
  await client.query("UPDATE productos SET unidad='unidad' WHERE id=$1", [rice]);
  expect((await getInventoryPurchases()).products.find((row) => row.id === rice)?.comparison.issues).toContain("unit-mismatch");
  vi.mocked(requireAccess).mockRejectedValueOnce(expectedActionError("Denied"));
  await expect(getInventoryPurchases()).rejects.toThrow("Denied");
});
