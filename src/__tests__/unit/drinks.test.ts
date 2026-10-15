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

import { addDrinkItem, createDrinkItem, saveDrinkCounts, setDrinkActive, setDrinkTarget } from "@/lib/actions/drinks";
import { getDrinkCreationOptions, getDrinkHistory, getDrinkManagement, getDrinksInventory } from "@/lib/queries/drinks";

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

it("Admin manages canonical drink placements and objectives separately from inventory counts",async()=>{
 expect((await createDrinkItem({name:"Cola 600 ml",unitId,location:"Bar",category:"Refrescos",countUnit:"botella"})).ok).toBe(true);
 expect((await createDrinkItem({name:"Cola 600 ml",unitId,location:"Depósito",category:"Refrescos",countUnit:"botella"})).ok).toBe(true);
 const items=await getDrinkManagement();const item=items.find(row=>row.location==="Bar");if(!item)throw new Error("Missing item");itemId=item.id;
 expect((await client.query("SELECT * FROM productos WHERE nombre='Cola 600 ml'")).rows).toHaveLength(1);
 expect((await setDrinkTarget({itemId,quantity:"12"})).ok).toBe(true);
 expect((await getDrinksInventory()).items.find(row=>row.id===itemId)).toMatchObject({unit:"botella",quantity:null,targetQuantity:"12.00",targetUnit:"botella"});
 expect((await client.query("SELECT * FROM observaciones_bebidas")).rows).toHaveLength(0);
});
it("closes legacy snapshot saves and denies unrelated roles",async()=>{
 actor.role="waitress";expect((await saveDrinkCounts([{itemId,quantity:"0",unit:"botella"}],"Refrescos")).ok).toBe(false);
 expect((await getDrinkHistory()).entries).toHaveLength(0);
 for(const role of ["kitchen",null] as const){actor.role=role;await expect(getDrinksInventory()).rejects.toThrow("Denied");await expect(saveDrinkCounts([])).rejects.toThrow("Denied");}
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


it("Waitress can add drinks but cannot modify or restore existing items through the add endpoint", async () => {
  actor.role = "waitress";
  expect((await getDrinkCreationOptions()).units.length).toBeGreaterThan(0);
  const input = { name: "New lemonade", unitId, location: "Bar", category: "Refrescos", countUnit: "botella" };
  expect((await addDrinkItem(input)).ok).toBe(true);
  expect((await addDrinkItem({ ...input, location: "Depósito" })).ok).toBe(true);
  expect((await client.query("SELECT * FROM productos WHERE nombre='New lemonade'")).rows).toHaveLength(1);
  const before = (await client.query("SELECT * FROM inventario_bebidas_productos b JOIN productos p ON p.id=b.producto_id WHERE p.nombre='New lemonade' ORDER BY b.ubicacion")).rows;
  expect((await addDrinkItem({ ...input, category: "Alcoholes", countUnit: null, targetQuantity: "99" })).ok).toBe(false);
  expect((await client.query("SELECT * FROM inventario_bebidas_productos b JOIN productos p ON p.id=b.producto_id WHERE p.nombre='New lemonade' ORDER BY b.ubicacion")).rows).toEqual(before);
  await client.query("UPDATE inventario_bebidas_productos SET activo=false WHERE producto_id=(SELECT id FROM productos WHERE nombre='New lemonade') AND ubicacion='Bar'");
  expect((await addDrinkItem(input)).ok).toBe(false);
  expect((await getDrinksInventory()).items.some((item) => item.name === input.name && item.location === "Bar")).toBe(false);
  await expect(createDrinkItem(input)).rejects.toThrow("Denied");
  await expect(setDrinkTarget({ itemId, quantity: "2" })).rejects.toThrow("Denied");
  await expect(setDrinkActive({ itemId, active: false })).rejects.toThrow("Denied");
  for (const role of ["kitchen", null] as const) {
    actor.role = role;
    await expect(addDrinkItem(input)).rejects.toThrow("Denied");
    await expect(getDrinkCreationOptions()).rejects.toThrow("Denied");
  }
  actor.role = "admin";
  expect((await createDrinkItem(input)).ok).toBe(true);
});
