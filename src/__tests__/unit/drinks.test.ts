import { randomUUID } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";

import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";

const actor = vi.hoisted((): { role: "admin" | "kitchen" | "waitress" | null } => ({ role: "admin" }));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/access", async () => {
  const { canAccess } = await import("@/lib/auth/policy");
  return { requireAccess: (area: "main" | "inventory" | "drinks") => {
    if (!canAccess(actor.role, area)) throw new Error("Denied");
    return Promise.resolve("staff_user");
  } };
});
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

import { createDrinkItem, saveDrinkCounts, setDrinkActive, setDrinkTarget } from "@/lib/actions/drinks";
import { getDrinkHistory, getDrinkManagement, getDrinksInventory } from "@/lib/queries/drinks";

let client: PGlite;
let unitId: string;
let itemId: string;

beforeAll(async () => {
  const databaseModule = await import("@/db");
  const value: unknown = Reflect.get(databaseModule, "testClient");
  if (!(value instanceof PGlite)) throw new Error("Missing test database");
  client = value;
  for (const file of readdirSync("drizzle").filter((name) => name.endsWith(".sql")).sort()) {
    await client.exec(`BEGIN;${readFileSync(`drizzle/${file}`, "utf8")};COMMIT;`);
  }
  const units = await client.query<{ id: string }>("SELECT id FROM unidades WHERE codigo='unidad'");
  const unit = units.rows[0];
  if (unit === undefined) throw new Error("Missing unit");
  unitId = unit.id;
}, 30000);
beforeEach(() => { actor.role = "admin"; });
afterAll(async () => { await client.close(); });

it("Admin builds a separate drinks list with canonical products and per-location targets", async () => {
  expect((await createDrinkItem({ name: "Cola 600 ml", unitId, location: "Bar" })).ok).toBe(true);
  expect((await createDrinkItem({ name: "Cola 600 ml", unitId, location: "Depósito" })).ok).toBe(true);
  expect((await createDrinkItem({ name: "Cola 600 ml", unitId, location: "Bar" })).ok).toBe(true);
  const items = await getDrinkManagement();
  expect(items).toHaveLength(2);
  expect((await client.query("SELECT * FROM productos WHERE nombre='Cola 600 ml'")).rows).toHaveLength(1);
  const bar = items.find((row) => row.location === "Bar");
  if (bar === undefined) throw new Error("Missing drink");
  itemId = bar.id;
  expect(bar.targetQuantity).toBeNull();
  expect((await setDrinkTarget({ itemId, quantity: "12" })).ok).toBe(true);
  expect((await getDrinksInventory()).items.find((row) => row.id === itemId)).toMatchObject({ quantity: null, targetQuantity: "12.00", targetUnit: "unidad" });
  expect((await client.query("SELECT * FROM heladera_productos")).rows).toHaveLength(0);
  expect((await client.query("SELECT * FROM observaciones_inventario")).rows).toHaveLength(0);
});

it("Waitress counts zero, corrects a weekly snapshot, preserves audit records and cannot edit the catalogue", async () => {
  actor.role = "waitress";
  expect((await saveDrinkCounts([{ itemId, quantity: "0", unit: "unidad" }])).ok).toBe(true);
  expect((await saveDrinkCounts([{ itemId, quantity: "5.50", unit: "unidad" }])).ok).toBe(true);
  const inventory = await getDrinksInventory();
  expect(inventory.items.find((item) => item.id === itemId)).toMatchObject({ quantity: "5.50", countedUnit: "unidad" });
  expect(inventory.items.find((item) => item.location === "Depósito")?.quantity).toBeNull();
  const history = await getDrinkHistory();
  expect(history.weeks).toEqual([inventory.week]);
  expect(history.entries).toHaveLength(1);
  expect(history.entries[0]).toMatchObject({ quantity: "5.50", name: "Cola 600 ml", location: "Bar", recordedBy: "staff_user" });
  expect((await client.query("SELECT * FROM observaciones_bebidas")).rows).toHaveLength(2);
  await expect(client.query("UPDATE observaciones_bebidas SET cantidad=9")).rejects.toThrow("append-only");
  await expect(client.query("DELETE FROM observaciones_bebidas")).rejects.toThrow("append-only");
  await expect(createDrinkItem({ name: "Wine", unitId, location: "Bar" })).rejects.toThrow("Denied");
  await expect(setDrinkTarget({ itemId, quantity: "1", unit: "pack" })).rejects.toThrow("Denied");
  await expect(setDrinkActive({ itemId, active: false })).rejects.toThrow("Denied");
  await expect(getDrinkManagement()).rejects.toThrow("Denied");
});

it("uses historical names and units even after catalogue changes, and validates counts atomically", async () => {
  const product = await client.query<{ producto_id: string }>("SELECT producto_id FROM inventario_bebidas_productos WHERE id=$1", [itemId]);
  await client.query("UPDATE productos SET nombre='Renamed cola',unidad='pack' WHERE id=$1", [product.rows[0]?.producto_id]);
  expect((await getDrinkHistory()).entries[0]?.name).toBe("Cola 600 ml");
  expect((await getDrinkHistory()).entries[0]?.unit).toBe("unidad");
  expect((await getDrinksInventory()).items.find((item) => item.id === itemId)).toMatchObject({ unit: "pack", countedUnit: "unidad", targetUnit: "unidad" });
  expect((await saveDrinkCounts([{ itemId, quantity: "1", unit: "unidad" }])).ok).toBe(false);
  const before = (await client.query("SELECT * FROM observaciones_bebidas")).rows;
  for (const input of [
    [{ itemId, quantity: "-1", unit: "pack" }], [{ itemId, quantity: "", unit: "pack" }], [{ itemId, quantity: "1.234", unit: "pack" }],
    [{ itemId, quantity: "1", unit: "pack" }, { itemId, quantity: "2", unit: "pack" }],
    [{ itemId, quantity: "1", unit: "pack" }, { itemId: randomUUID(), quantity: "2", unit: "pack" }],
  ]) expect((await saveDrinkCounts(input)).ok).toBe(false);
  expect((await client.query("SELECT * FROM observaciones_bebidas")).rows).toEqual(before);
  await setDrinkActive({ itemId, active: false });
  expect((await saveDrinkCounts([{ itemId, quantity: "2", unit: "pack" }])).ok).toBe(false);
  expect((await getDrinksInventory()).items.some((item) => item.id === itemId)).toBe(false);
  expect((await getDrinkHistory()).entries).toHaveLength(1);
  await setDrinkActive({ itemId, active: true });
});

it("denies Kitchen and users without roles on all drinks reads and saves", async () => {
  for (const role of ["kitchen", null] as const) {
    actor.role = role;
    await expect(getDrinksInventory()).rejects.toThrow("Denied");
    await expect(getDrinkHistory()).rejects.toThrow("Denied");
    await expect(saveDrinkCounts([{ itemId, quantity: "9", unit: "pack" }])).rejects.toThrow("Denied");
  }
});

it("separates weekly snapshots and compares against the prior drinks week", async () => {
  await client.exec("ALTER TABLE observaciones_bebidas DISABLE TRIGGER bebidas_snapshot_insert");
  await client.query("INSERT INTO observaciones_bebidas(item_id,semana,nombre,ubicacion,cantidad,unidad,registrado_at,registrado_por) VALUES ($1,'2020-01-07','Old name','Old location',7,'pack','2020-01-07T12:00:00Z','older_staff')", [itemId]);
  await client.exec("ALTER TABLE observaciones_bebidas ENABLE TRIGGER bebidas_snapshot_insert");
  const inventory = await getDrinksInventory();
  expect(inventory.items.find((item) => item.id === itemId)).toMatchObject({ previousQuantity: "7.00", previousUnit: "pack" });
  const old = await getDrinkHistory(1, "2020-01-07");
  expect(old.entries[0]).toMatchObject({ name: "Old name", location: "Old location", quantity: "7.00", unit: "pack" });
  expect((await getDrinkHistory()).weeks).toHaveLength(2);
});

it("protects drinks from provider product deletion", async () => {
  const { removeProductFromProvider } = await import("@/lib/actions/products");
  const rows = await client.query<{ producto_id: string }>("SELECT producto_id FROM inventario_bebidas_productos WHERE id=$1", [itemId]);
  const productId = rows.rows[0]?.producto_id;
  if (productId === undefined) throw new Error("Missing canonical drink product");
  const providerId = randomUUID();
  await client.query("INSERT INTO proveedores(id,nombre) VALUES ($1,'Drink supplier')", [providerId]);
  await client.query("INSERT INTO proveedor_productos(proveedor_id,producto_id,precio) VALUES ($1,$2,10)", [providerId, productId]);
  expect((await removeProductFromProvider(providerId, productId)).ok).toBe(false);
  expect((await client.query("SELECT * FROM proveedor_productos WHERE proveedor_id=$1 AND producto_id=$2", [providerId, productId])).rows).toHaveLength(1);
});
