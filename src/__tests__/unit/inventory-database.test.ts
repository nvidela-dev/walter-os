import { randomUUID } from "node:crypto";
import { readdirSync,readFileSync } from "node:fs";

import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/access", () => ({ requireAccess: vi.fn(() => Promise.resolve("user_inventory")) }));
vi.mock("@/db", async () => {
  const { drizzle } = await import("drizzle-orm/pglite");
  const client = new PGlite();
  const db = drizzle(client);
  // PGlite has interactive transactions; Neon HTTP exposes atomic batch instead.
  return { db: Object.assign(db, { batch: async (queries: PromiseLike<unknown>[]) => {
    await client.exec("BEGIN");
    try {
      for (const query of queries) await query;
      await client.exec("COMMIT");
    } catch (error) { await client.exec("ROLLBACK"); throw error; }
  } }), testClient: client };
});

import { db } from "@/db";
import { expectedActionError } from "@/lib/action-result";
import { addFridgeProduct, createFridge, createInventoryProduct, editInventoryEntry, removeInventoryEntry, saveInventory, updateFridgeDetails } from "@/lib/actions/inventory";
import { addManualCatalogue } from "@/lib/actions/manual-catalogue";
import { linkExistingProduct } from "@/lib/actions/products";
import { requireAccess } from "@/lib/auth/access";
import { getFridge, getFridgeInventory, getInventoryHistory, searchInventoryProducts } from "@/lib/queries/inventory";
import { getInventoryItemDetail, getInventoryItemSuggestions } from "@/lib/queries/inventory-items";

const fixture = { fridge: randomUUID(), secondFridge: randomUUID(), product: randomUUID(), unlinked: randomUUID(), provider: randomUUID() };
let client: PGlite;
let unitId: string;

beforeAll(async () => {
  const mocked = await import("@/db");
  // Test-only export; the production database module remains untouched.
  const clientValue: unknown = Reflect.get(mocked, "testClient");
  if (!(clientValue instanceof PGlite)) throw new Error("Missing isolated database");
  client = clientValue;
  const migrations = readdirSync("drizzle").filter((name) => name.endsWith(".sql")).sort();
  for (const migration of migrations.filter((name) => !name.startsWith("0012") && !name.startsWith("0013") && !name.startsWith("0014") && !name.startsWith("0015") && !name.startsWith("0016") && !name.startsWith("0017"))) {
    await client.exec(readFileSync(`drizzle/${migration}`, "utf8"));
  }
  const units = await client.query<{ id: string }>("SELECT id FROM unidades WHERE codigo = 'unidad'");
  unitId = units.rows[0]?.id ?? "";
  await client.query("INSERT INTO productos (id, nombre, unidad_id) VALUES ($1, 'Cola', $3), ($2, 'Water', $3)", [fixture.product, fixture.unlinked, unitId]);
  await client.query("INSERT INTO proveedores (id, nombre) VALUES ($1, 'Provider')", [fixture.provider]);
  await client.query("INSERT INTO proveedor_productos (proveedor_id, producto_id, precio) VALUES ($1, $2, 50)", [fixture.provider, fixture.product]);
  const before = await client.query("SELECT * FROM productos ORDER BY id");
  await client.exec(readFileSync("drizzle/0012_inventory.sql", "utf8"));
  await client.exec(readFileSync("drizzle/0013_soft_valkyrie.sql", "utf8"));
  await client.exec(readFileSync("drizzle/0014_concerned_nemesis.sql", "utf8"));
  await client.exec(readFileSync("drizzle/0015_bored_mandroid.sql", "utf8"));
  await client.exec(readFileSync("drizzle/0016_zippy_leper_queen.sql", "utf8"));
  await client.exec(`BEGIN;${  readFileSync("drizzle/0017_weekly_inventory.sql", "utf8")  };COMMIT;`);
  expect((await client.query("SELECT * FROM productos ORDER BY id")).rows).toEqual(before.rows);
  await client.query("INSERT INTO heladeras (id, numero) VALUES ($1, 1), ($2, 2)", [fixture.fridge, fixture.secondFridge]);
}, 30000);
afterAll(async () => { await client.close(); });

describe("inventory vertical slice on isolated PostgreSQL", () => {
  it("adds canonical products with and without provider and keeps a unique catalogue", async () => {
    for (const productId of [fixture.product, fixture.unlinked, fixture.product]) {
      expect(await addFridgeProduct({ fridgeId: fixture.fridge, productId })).toEqual({ ok: true, data: undefined });
    }
    const rows = await getFridgeInventory(fixture.fridge);
    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.id === fixture.product)?.providers).toEqual(["Provider"]);
    expect(rows.find((row) => row.id === fixture.unlinked)?.providers).toEqual([]);
    expect(rows.every((row) => row.current === null && row.difference === null)).toBe(true);
  });
  it("creates a provider-less canonical product and immediately tracks it", async () => {
    expect((await createInventoryProduct({ fridgeId: fixture.fridge, name: "Juice", unitId })).ok).toBe(true);
    const [product] = await searchInventoryProducts("Juice");
    expect(product).toBeDefined();
    const rows = await getFridgeInventory(fixture.fridge);
    expect(rows.find((row) => row.id === product?.id)?.providers).toEqual([]);
    expect((await client.query("SELECT * FROM proveedor_productos WHERE producto_id=$1", [product?.id])).rows).toHaveLength(0);
    expect((await linkExistingProduct({ providerId: fixture.provider, productId: product?.id, price: "30", quantity: "1" })).ok).toBe(true);
    expect((await getFridgeInventory(fixture.fridge)).find((row) => row.id === product?.id)?.providers).toEqual(["Provider"]);
  });
  it("retains 12 then 8, records actor, and does not treat no baseline as zero", async () => {
    for (const quantity of ["12", "8"]) expect((await saveInventory({ fridgeId: fixture.fridge, counts: [{ productId: fixture.product, quantity }] })).ok).toBe(true);
    const history = await client.query<{ cantidad: string; registrado_por: string }>("SELECT cantidad, registrado_por FROM observaciones_inventario WHERE producto_id=$1 ORDER BY id", [fixture.product]);
    expect(history.rows.map((row) => row.cantidad)).toEqual(["12.00", "8.00"]);
    expect(history.rows.every((row) => row.registrado_por === "user_inventory")).toBe(true);
    const row = (await getFridgeInventory(fixture.fridge)).find((row) => row.id === fixture.product);
    expect(row?.current?.quantity).toBe("8.00");
    expect(row?.previous).toBeNull();
    expect(row?.difference).toBeNull();
  });
  it("uses the latest observation at or before 168 hours earlier, with deterministic ties", async () => {
    const productId = fixture.unlinked;
    for (const [date, quantity] of [["2026-09-22T12:00:00Z", "30"], ["2026-09-23T12:00:00Z", "18"], ["2026-09-23T12:00:00Z", "17"], ["2026-09-24T12:00:00Z", "20"], ["2026-09-30T12:00:00Z", "12"]]) {
      await client.query("INSERT INTO observaciones_inventario (heladera_id, producto_id, cantidad, unidad, registrado_at, registrado_por) VALUES ($1,$2,$3,'unidad',$4,'fixture')", [fixture.fridge, productId, quantity, date]);
    }
    const row = (await getFridgeInventory(fixture.fridge)).find((row) => row.id === productId);
    expect(row?.current?.quantity).toBe("12.00");
    expect(row?.previous?.quantity).toBe("17.00");
    expect(row?.difference).toBe("-5");
    expect(row?.previous?.recordedAt).toBe("2026-09-23T12:00:00.000Z");
    await addFridgeProduct({ fridgeId: fixture.secondFridge, productId });
    expect((await getFridgeInventory(fixture.secondFridge))[0]?.current).toBeNull();
  });
  it("rejects edits, deletes, negative counts, and removal of tracked products", async () => {
    await expect(client.exec("UPDATE observaciones_inventario SET cantidad=0")).rejects.toThrow("append-only");
    await expect(client.exec("DELETE FROM observaciones_inventario")).rejects.toThrow("append-only");
    await expect(client.query("DELETE FROM productos WHERE id=$1", [fixture.product])).rejects.toThrow();
    await expect(client.query("INSERT INTO observaciones_inventario (heladera_id,producto_id,cantidad,unidad,registrado_por) VALUES ($1,$2,-1,'unidad','fixture')", [fixture.fridge, fixture.product])).rejects.toThrow();
  });
  it("accepts zero and rejects invalid, duplicate, untracked, or inactive counts without partial saves", async () => {
    expect((await saveInventory({ fridgeId: fixture.fridge, counts: [{ productId: fixture.product, quantity: "0" }] })).ok).toBe(true);
    for (const quantity of ["", "-1", "1.234", "NaN", "10000000000"]) {
      expect((await saveInventory({ fridgeId: fixture.fridge, counts: [{ productId: fixture.product, quantity }] })).ok).toBe(false);
    }
    const countBefore = (await client.query("SELECT count(*) FROM observaciones_inventario")).rows;
    expect((await saveInventory({ fridgeId: fixture.fridge, counts: [{ productId: fixture.product, quantity: "9" }, { productId: randomUUID(), quantity: "8" }] })).ok).toBe(false);
    expect((await saveInventory({ fridgeId: fixture.fridge, counts: [{ productId: fixture.product, quantity: "9" }, { productId: fixture.product, quantity: "8" }] })).ok).toBe(false);
    await client.query("UPDATE heladeras SET activa=false WHERE id=$1", [fixture.secondFridge]);
    expect((await saveInventory({ fridgeId: fixture.secondFridge, counts: [{ productId: fixture.unlinked, quantity: "2" }] })).ok).toBe(false);
    expect((await client.query("SELECT count(*) FROM observaciones_inventario")).rows).toEqual(countBefore);
  });
  it("rolls back product creation if the second batch statement fails", async () => {
    const id = randomUUID();
    const { products, fridgeProducts } = await import("@/db/schema");
    await expect(db.batch([
      db.insert(products).values({ id, name: "Should roll back" }),
      db.insert(fridgeProducts).values({ fridgeId: randomUUID(), productId: id }),
    ])).rejects.toThrow();
    expect((await client.query("SELECT * FROM productos WHERE id=$1", [id])).rows).toHaveLength(0);
  });
  it("requires access before performing writes or queries", async () => {
    vi.mocked(requireAccess).mockRejectedValueOnce(expectedActionError("denied"));
    expect((await createFridge({ number: 500, name: "" })).ok).toBe(false);
    expect((await client.query("SELECT * FROM heladeras WHERE numero=500")).rows).toHaveLength(0);
    vi.mocked(requireAccess).mockRejectedValueOnce(expectedActionError("denied"));
    await expect(getFridgeInventory(fixture.fridge)).rejects.toThrow("denied");
  });
});


describe("one-time manual catalogue", () => {
  it("creates one canonical product across two fridges and safely repeats without stock counts", async () => {
    await client.query("UPDATE heladeras SET activa=true WHERE id=$1", [fixture.secondFridge]);
    const rows = [fixture.fridge, fixture.secondFridge].map((fridgeId) => ({ fridgeId, name: "Manual pasta", unitId, productId: null }));
    expect((await addManualCatalogue(rows)).ok).toBe(true);
    expect((await addManualCatalogue(rows)).ok).toBe(true);
    const result = await client.query<{ id: string }>("SELECT id FROM productos WHERE nombre='Manual pasta'");
    expect(result.rows).toHaveLength(1);
    expect((await client.query("SELECT * FROM heladera_productos WHERE producto_id=$1", [result.rows[0]?.id])).rows).toHaveLength(2);
    expect((await client.query("SELECT * FROM observaciones_inventario WHERE producto_id=$1", [result.rows[0]?.id])).rows).toHaveLength(0);
  });
  it("rejects invalid fridge assignments before creating products", async () => {
    expect((await addManualCatalogue([{ name: "Must not create", fridgeId: randomUUID(), unitId, productId: null }])).ok).toBe(false);
    expect((await client.query("SELECT * FROM productos WHERE nombre='Must not create'")).rows).toHaveLength(0);
  });
  it("requires inventory access", async () => {
    vi.mocked(requireAccess).mockRejectedValueOnce(expectedActionError("Denied"));
    expect((await addManualCatalogue([{ name: "Denied candidate", fridgeId: fixture.fridge, unitId, productId: null }])).ok).toBe(false);
  });
});


describe("inventory entry removal", () => {
  it("hides only one fridge membership, retains history, and allows restoration", async () => {
    await client.query("UPDATE heladeras SET activa=true WHERE id=$1", [fixture.secondFridge]);
    await addFridgeProduct({ fridgeId: fixture.secondFridge, productId: fixture.product });
    const history = (await client.query("SELECT * FROM observaciones_inventario WHERE producto_id=$1", [fixture.product])).rows;
    expect((await removeInventoryEntry({ fridgeId: fixture.fridge, productId: fixture.product })).ok).toBe(true);
    expect((await getFridgeInventory(fixture.fridge)).some((row) => row.id === fixture.product)).toBe(false);
    expect((await getFridgeInventory(fixture.secondFridge)).some((row) => row.id === fixture.product)).toBe(true);
    expect((await saveInventory({ fridgeId: fixture.fridge, counts: [{ productId: fixture.product, quantity: "8" }] })).ok).toBe(false);
    expect((await client.query("SELECT * FROM observaciones_inventario WHERE producto_id=$1", [fixture.product])).rows).toEqual(history);
    await addFridgeProduct({ fridgeId: fixture.fridge, productId: fixture.product });
    expect((await getFridgeInventory(fixture.fridge)).some((row) => row.id === fixture.product)).toBe(true);
  });
  it("denies removal without access", async () => {
    vi.mocked(requireAccess).mockRejectedValueOnce(expectedActionError("Denied"));
    expect((await removeInventoryEntry({ fridgeId: fixture.fridge, productId: fixture.product })).ok).toBe(false);
    expect((await getFridgeInventory(fixture.fridge)).some((row) => row.id === fixture.product)).toBe(true);
  });
});

it("shares inventory corrections between different Kitchen users", async () => {
  const productId = randomUUID();
  await client.query("INSERT INTO productos(id,nombre,unidad,unidad_id) VALUES ($1,'Shared kitchen item','unidad',$2)", [productId, unitId]);
  vi.mocked(requireAccess).mockResolvedValueOnce("kitchen_a");
  expect((await addFridgeProduct({ fridgeId: fixture.fridge, productId })).ok).toBe(true);
  vi.mocked(requireAccess).mockResolvedValueOnce("kitchen_a");
  expect((await saveInventory({ fridgeId: fixture.fridge, counts: [{ productId, quantity: "5" }] })).ok).toBe(true);
  vi.mocked(requireAccess).mockResolvedValueOnce("kitchen_b");
  expect((await getFridgeInventory(fixture.fridge)).find((row) => row.id === productId)?.current?.quantity).toBe("5.00");
  vi.mocked(requireAccess).mockResolvedValueOnce("kitchen_b");
  expect((await saveInventory({ fridgeId: fixture.fridge, counts: [{ productId, quantity: "3" }] })).ok).toBe(true);
  vi.mocked(requireAccess).mockResolvedValueOnce("kitchen_a");
  expect((await getFridgeInventory(fixture.fridge)).find((row) => row.id === productId)?.current?.quantity).toBe("3.00");
  const history = await client.query<{ registrado_por: string }>("SELECT registrado_por FROM observaciones_inventario WHERE producto_id=$1 ORDER BY id", [productId]);
  expect(history.rows.map((row) => row.registrado_por)).toEqual(["kitchen_a", "kitchen_b"]);
});

it("shares fridge-specific notes without creating counts, and allows clearing", async () => {
  await addFridgeProduct({ fridgeId: fixture.secondFridge, productId: fixture.product });
  const before = (await client.query("SELECT * FROM observaciones_inventario")).rows;
  expect((await editInventoryEntry({ fridgeId: fixture.fridge, productId: fixture.product, quantity: null, note: "  Paquete abierto  " })).ok).toBe(true);
  expect((await getFridgeInventory(fixture.fridge)).find((row) => row.id === fixture.product)?.note).toBe("Paquete abierto");
  expect((await getFridgeInventory(fixture.secondFridge)).find((row) => row.id === fixture.product)?.note).toBeNull();
  expect((await client.query("SELECT * FROM observaciones_inventario")).rows).toEqual(before);
  expect((await editInventoryEntry({ fridgeId: fixture.fridge, productId: fixture.product, quantity: "7", note: "" })).ok).toBe(true);
  const row = (await getFridgeInventory(fixture.fridge)).find((item) => item.id === fixture.product);
  expect(row?.note).toBeNull();
  expect(row?.current?.quantity).toBe("7.00");
  vi.mocked(requireAccess).mockRejectedValueOnce(expectedActionError("Denied"));
  expect((await editInventoryEntry({ fridgeId: fixture.fridge, productId: fixture.product, quantity: null, note: "Denied" })).ok).toBe(false);
});

it("allows Kitchen to edit shared fridge details while preserving its number and contents", async () => {
  const before = (await client.query("SELECT * FROM heladera_productos WHERE heladera_id=$1", [fixture.fridge])).rows;
  vi.mocked(requireAccess).mockResolvedValueOnce("kitchen_a");
  expect((await updateFridgeDetails({ fridgeId: fixture.fridge, number: 1, name: "  Cocina  ", commentary: "  Revisar puerta  " })).ok).toBe(true);
  vi.mocked(requireAccess).mockResolvedValueOnce("kitchen_b");
  const fridge = await getFridge(fixture.fridge);
  expect(fridge?.name).toBe("Cocina");
  expect(fridge?.commentary).toBe("Revisar puerta");
  expect(fridge?.number).toBe(1);
  expect((await client.query("SELECT * FROM heladera_productos WHERE heladera_id=$1", [fixture.fridge])).rows).toEqual(before);
  expect((await updateFridgeDetails({ fridgeId: fixture.fridge, number: 1, name: "", commentary: "" })).ok).toBe(true);
  expect((await getFridge(fixture.fridge))?.commentary).toBeNull();
  vi.mocked(requireAccess).mockRejectedValueOnce(expectedActionError("Denied"));
  expect((await updateFridgeDetails({ fridgeId: fixture.fridge, number: 1, name: "Denied", commentary: "" })).ok).toBe(false);
});

it("keeps full historical counts for hidden products and pages without losing old records", async () => {
  const productId = randomUUID();
  await client.query("INSERT INTO productos(id,nombre,unidad,unidad_id) VALUES ($1,'History item','unidad',$2)", [productId, unitId]);
  await addFridgeProduct({ fridgeId: fixture.fridge, productId });
  await client.query("INSERT INTO observaciones_inventario(heladera_id,producto_id,cantidad,unidad,registrado_por) SELECT $1,$2,n,'unidad','kitchen' FROM generate_series(1,105) n", [fixture.fridge, productId]);
  await removeInventoryEntry({ fridgeId: fixture.fridge, productId });
  const first = await getInventoryHistory(1, fixture.fridge);
  expect(first.rows).toHaveLength(100);
  expect(first.hasNext).toBe(true);
  expect(first.rows[0]?.quantity).toBe("105.00");
  await client.query("INSERT INTO observaciones_inventario(heladera_id,producto_id,cantidad,unidad,registrado_por) VALUES ($1,$2,106,'unidad','kitchen')", [fixture.fridge, productId]);
  const second = await getInventoryHistory(2, fixture.fridge, first.throughId ?? undefined);
  const historical = [...first.rows, ...second.rows].filter((row) => row.name === "History item");
  expect(historical).toHaveLength(105);
  expect(new Set(historical.map((row) => row.id)).size).toBe(105);
  expect(historical.some((row) => row.quantity === "106.00")).toBe(false);
  vi.mocked(requireAccess).mockRejectedValueOnce(expectedActionError("Denied"));
  await expect(getInventoryHistory(1)).rejects.toThrow("Denied");
});

it("renumbers a fridge without changing its identity and rejects duplicate or invalid numbers", async () => {
  const before = (await client.query("SELECT * FROM heladera_productos WHERE heladera_id=$1", [fixture.fridge])).rows;
  expect((await updateFridgeDetails({ fridgeId: fixture.fridge, number: 10, name: "Cocina", commentary: "" })).ok).toBe(true);
  expect((await getFridge(fixture.fridge))?.number).toBe(10);
  expect((await client.query("SELECT * FROM heladera_productos WHERE heladera_id=$1", [fixture.fridge])).rows).toEqual(before);
  expect((await updateFridgeDetails({ fridgeId: fixture.fridge, number: 2, name: "Cocina", commentary: "" })).ok).toBe(false);
  for (const number of [0, -1, 1.5, "", 2147483648]) {
    expect((await updateFridgeDetails({ fridgeId: fixture.fridge, number, name: "Cocina", commentary: "" })).ok).toBe(false);
  }
  expect((await getFridge(fixture.fridge))?.number).toBe(10);
});

it("searches active inventory items and returns all fridge locations and providers", async () => {
  const suggestions = await getInventoryItemSuggestions();
  expect(suggestions.some((item) => item.id === fixture.product)).toBe(true);
  const detail = await getInventoryItemDetail(fixture.product);
  expect(detail?.providers).toEqual(["Provider"]);
  expect(detail?.locations).toHaveLength(2);
  expect(detail?.locations.map((location) => location.id)).toEqual(expect.arrayContaining([fixture.fridge, fixture.secondFridge]));
  expect(await getInventoryItemDetail("invalid")).toBeNull();
  await removeInventoryEntry({ fridgeId: fixture.fridge, productId: fixture.product });
  await removeInventoryEntry({ fridgeId: fixture.secondFridge, productId: fixture.product });
  expect(await getInventoryItemDetail(fixture.product)).toBeNull();
  expect((await getInventoryItemSuggestions()).some((item) => item.id === fixture.product)).toBe(false);
  vi.mocked(requireAccess).mockRejectedValueOnce(expectedActionError("Denied"));
  await expect(getInventoryItemDetail(fixture.product)).rejects.toThrow("Denied");
});

it("reports saved weekly counts including zero, and excludes hidden placements without deleting history", async () => {
  const { getLatestInventoryProgress, getLatestInventoryRun } = await import("@/lib/queries/inventory-runs");
  const fridgeId = randomUUID();
  const countedId = randomUUID();
  const uncountedId = randomUUID();
  await client.query("INSERT INTO heladeras(id,numero) VALUES ($1,77)", [fridgeId]);
  await client.query("INSERT INTO productos(id,nombre,unidad) VALUES ($1,'Zero count','unidad'),($2,'Not reviewed','unidad')", [countedId, uncountedId]);
  await addFridgeProduct({ fridgeId, productId: countedId });
  await addFridgeProduct({ fridgeId, productId: uncountedId });
  const run = await getLatestInventoryRun();
  if (run === null) throw new Error("Missing fixture run");
  await client.query("INSERT INTO observaciones_inventario(heladera_id,producto_id,cantidad,unidad,registrado_por,registrado_at) VALUES ($1,$2,0,'unidad','kitchen',$3)", [fridgeId, countedId, `${run.day}T15:00:00Z`]);
  expect((await getLatestInventoryProgress()).fridges.find((row) => row.id === fridgeId)).toEqual({ id: fridgeId, counted: 1, total: 2 });
  await removeInventoryEntry({ fridgeId, productId: uncountedId });
  expect((await getLatestInventoryProgress()).fridges.find((row) => row.id === fridgeId)).toEqual({ id: fridgeId, counted: 1, total: 1 });
  await removeInventoryEntry({ fridgeId, productId: countedId });
  expect((await getLatestInventoryProgress()).fridges.find((row) => row.id === fridgeId)).toEqual({ id: fridgeId, counted: 0, total: 0 });
  expect((await client.query("SELECT * FROM inventario_items WHERE heladera_id=$1", [fridgeId])).rows).toHaveLength(1);
  vi.mocked(requireAccess).mockRejectedValueOnce(expectedActionError("Denied"));
  await expect(getLatestInventoryProgress()).rejects.toThrow("Denied");
});
