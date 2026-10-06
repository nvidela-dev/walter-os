import "server-only";

import { and, asc, desc, eq, ilike, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "@/db";
import { fridgeProducts, fridges, inventoryObservations, products } from "@/db/schema";
import { requireAccess } from "@/lib/auth/access";
import { type CountSnapshot,inventoryDifference } from "@/lib/inventory/comparison";
import { uuidSchema } from "@/lib/validation";

export interface InventoryRow {
  id: string;
  name: string;
  unit: string;
  note: string | null;
  providers: string[];
  current: CountSnapshot | null;
  previous: CountSnapshot | null;
  difference: string | null;
}

export async function getFridges(): Promise<(typeof fridges.$inferSelect)[]> {
  await requireAccess("inventory");
  return db.select().from(fridges).where(eq(fridges.active, true)).orderBy(fridges.number);
}

export async function getFridge(id: string): Promise<typeof fridges.$inferSelect | null> {
  await requireAccess("inventory");
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) return null;
  const [fridge] = await db.select().from(fridges).where(and(eq(fridges.id, parsed.data), eq(fridges.active, true)));
  return fridge ?? null;
}

// Lateral indexed lookups fetch only two observations per tracked product.
// Timestamp ties are broken by the monotonically increasing observation ID.
export function fridgeInventoryQuery(fridgeId: string): ReturnType<typeof buildInventoryQuery> {
  return buildInventoryQuery(fridgeId);
}

// Drizzle infers the lateral-join selection; retain that type for SQL integration tests.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function buildInventoryQuery(fridgeId: string) {
  const latest = db.select().from(inventoryObservations).where(and(
    eq(inventoryObservations.fridgeId, fridgeProducts.fridgeId),
    eq(inventoryObservations.productId, fridgeProducts.productId),
  )).orderBy(desc(inventoryObservations.recordedAt), desc(inventoryObservations.id)).limit(1).as("latest");
  const historical = alias(inventoryObservations, "historical");
  const previous = db.select().from(historical).where(and(
    eq(historical.fridgeId, fridgeProducts.fridgeId),
    eq(historical.productId, fridgeProducts.productId),
    sql`${historical.recordedAt} <= ${latest.recordedAt} - interval '168 hours'`,
  )).orderBy(desc(historical.recordedAt), desc(historical.id)).limit(1).as("previous");
  return db.select({
    id: products.id, name: products.name, unit: products.unit, note: fridgeProducts.note,
    currentQuantity: latest.quantity, currentUnit: latest.unit, currentAt: latest.recordedAt,
    previousQuantity: previous.quantity, previousUnit: previous.unit, previousAt: previous.recordedAt,
    providers: sql<string[]>`ARRAY(SELECT p.nombre FROM proveedor_productos pp JOIN proveedores p ON p.id = pp.proveedor_id WHERE pp.producto_id = ${products.id} ORDER BY p.nombre)`,
  }).from(fridgeProducts).innerJoin(products, eq(products.id, fridgeProducts.productId))
    .leftJoinLateral(latest, sql`true`).leftJoinLateral(previous, sql`true`)
    .where(and(eq(fridgeProducts.fridgeId, fridgeId), eq(fridgeProducts.active, true))).orderBy(asc(products.name), asc(products.id));
}

export async function getFridgeInventory(fridgeId: string): Promise<InventoryRow[]> {
  await requireAccess("inventory");
  uuidSchema.parse(fridgeId);
  const rows = await fridgeInventoryQuery(fridgeId);
  return rows.map((row) => {
    const current = row.currentAt === null || row.currentQuantity === null || row.currentUnit === null ? null : {
      quantity: row.currentQuantity, unit: row.currentUnit, recordedAt: row.currentAt.toISOString(),
    };
    const previous = row.previousAt === null || row.previousQuantity === null || row.previousUnit === null ? null : {
      quantity: row.previousQuantity, unit: row.previousUnit, recordedAt: row.previousAt.toISOString(),
    };
    return { id: row.id, name: row.name, unit: row.unit, note: row.note, providers: row.providers, current, previous, difference: inventoryDifference(current, previous) };
  });
}

export async function searchInventoryProducts(query: string): Promise<{ id: string; name: string; unit: string }[]> {
  await requireAccess("inventory");
  const term = query.trim().slice(0, 200).replace(/[\\%_]/g, "\\$&");
  if (term.length === 0) return [];
  return db.select({ id: products.id, name: products.name, unit: products.unit }).from(products)
    .where(ilike(products.name, `%${term}%`)).orderBy(products.name, products.id).limit(30);
}
