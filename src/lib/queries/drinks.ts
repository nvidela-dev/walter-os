import "server-only";

import { and, desc, eq, inArray, isNull,lt, sql } from "drizzle-orm";

import { db } from "@/db";
import { drinkItems, drinkObservations, products, providerProducts, providers, units } from "@/db/schema";
import { requireAccess } from "@/lib/auth/access";
import { isoDateSchema } from "@/lib/validation";

export interface DrinkRow {
  id: string; name: string; unit: string; location: string; category: string;
  targetQuantity: string | null; targetUnit: string | null;
  quantity: string | null; countedUnit: string | null; countedAt: Date | null;
  previousQuantity: string | null; previousUnit: string | null;
}
export type DrinkHistoryRow = typeof drinkObservations.$inferSelect;

export async function getDrinksInventory(): Promise<{ week: string; items: DrinkRow[] }> {
  await requireAccess("drinks");
  const clock = await db.execute<{ week: string }>(sql`SELECT public.inventory_week((now() AT TIME ZONE 'America/Montevideo')::date)::text AS week`);
  const week = clock.rows[0]?.week;
  if (week === undefined) throw new Error("Missing inventory week");
  const current = db.selectDistinctOn([drinkObservations.itemId]).from(drinkObservations)
    .where(eq(drinkObservations.week, week)).orderBy(drinkObservations.itemId, desc(drinkObservations.recordedAt), desc(drinkObservations.id)).as("current_drinks");
  const [prior] = await db.selectDistinct({ week: drinkObservations.week }).from(drinkObservations)
    .where(lt(drinkObservations.week, week)).orderBy(desc(drinkObservations.week)).limit(1);
  const previous = db.selectDistinctOn([drinkObservations.itemId]).from(drinkObservations)
    .where(eq(drinkObservations.week, prior?.week ?? "0001-01-01"))
    .orderBy(drinkObservations.itemId, desc(drinkObservations.recordedAt), desc(drinkObservations.id)).as("previous_drinks");
  const items = await db.select({
    id: drinkItems.id, name: products.name, unit: sql<string>`coalesce(${drinkItems.countUnit}, ${products.unit})`, location: drinkItems.location, category: drinkItems.category,
    targetQuantity: drinkItems.targetQuantity, targetUnit: drinkItems.targetUnit,
    quantity: current.quantity, countedUnit: current.unit, countedAt: current.recordedAt,
    previousQuantity: previous.quantity, previousUnit: previous.unit,
  }).from(drinkItems).innerJoin(products, and(eq(products.id, drinkItems.productId), isNull(products.deletedAt)))
    .leftJoin(current, eq(current.itemId, drinkItems.id)).leftJoin(previous, eq(previous.itemId, drinkItems.id))
    .where(eq(drinkItems.active, true)).orderBy(drinkItems.location, products.name, drinkItems.id);
  return { week, items };
}

export async function getDrinkHistory(page = 1, selectedWeek?: string, category?: string): Promise<{ weeks: string[]; hasNext: boolean; selected: string | null; entries: DrinkHistoryRow[] }> {
  await requireAccess("drinks");
  if (!Number.isSafeInteger(page) || page < 1 || page > 1000000) throw new Error("Invalid history page");
  if (selectedWeek !== undefined) isoDateSchema.parse(selectedWeek);
  const categoryFilter = category === undefined ? undefined : inArray(drinkObservations.itemId, db.select({ id: drinkItems.id }).from(drinkItems).where(eq(drinkItems.category, category)));
  const rows = await db.selectDistinct({ week: drinkObservations.week }).from(drinkObservations)
    .where(categoryFilter).orderBy(desc(drinkObservations.week)).limit(11).offset((page - 1) * 10);
  const weeks = rows.slice(0, 10).map((row) => row.week);
  const selected = selectedWeek ?? weeks[0] ?? null;
  const entries = selected === null ? [] : await db.selectDistinctOn([drinkObservations.itemId]).from(drinkObservations)
    .where(and(eq(drinkObservations.week, selected), categoryFilter)).orderBy(drinkObservations.itemId, desc(drinkObservations.recordedAt), desc(drinkObservations.id));
  entries.sort((a, b) => a.location.localeCompare(b.location) || a.name.localeCompare(b.name));
  return { weeks, hasNext: rows.length > 10, selected, entries };
}

export async function getDrinkManagement(): Promise<{ id: string; name: string; unit: string; location: string; category: string; targetQuantity: string | null; targetUnit: string | null; active: boolean }[]> {
  await requireAccess("main");
  return db.select({ id: drinkItems.id, name: products.name, unit: sql<string>`coalesce(${drinkItems.countUnit}, ${products.unit})`, location: drinkItems.location, category: drinkItems.category,
    targetQuantity: drinkItems.targetQuantity, targetUnit: drinkItems.targetUnit, active: drinkItems.active,
  }).from(drinkItems).innerJoin(products, and(eq(products.id, drinkItems.productId), isNull(products.deletedAt))).orderBy(drinkItems.location, products.name);
}

export async function getDrinkCreationOptions(): Promise<{ units: { id: string; code: string; name: string }[]; locations: string[] }> {
  await requireAccess("drinks");
  const [unitRows, locationRows] = await Promise.all([
    db.select({ id: units.id, code: units.code, name: units.name }).from(units).orderBy(units.name),
    db.selectDistinct({ location: drinkItems.location }).from(drinkItems)
      .innerJoin(products, and(eq(products.id, drinkItems.productId), isNull(products.deletedAt)))
      .where(eq(drinkItems.active, true)).orderBy(drinkItems.location),
  ]);
  return { units: unitRows, locations: locationRows.map((row) => row.location) };
}

// Names only: this read path is available to counting staff without supplier management access.
export async function getDrinkSuppliers(): Promise<{ itemId: string; providerId: string; name: string }[]> {
  await requireAccess("drinks");
  return db.select({ itemId: drinkItems.id, providerId: providers.id, name: providers.name }).from(drinkItems)
    .innerJoin(providerProducts, eq(providerProducts.productId, drinkItems.productId))
    .innerJoin(providers, eq(providers.id, providerProducts.providerId));
}
export async function getDrinkCategoryAssignments(): Promise<{ itemId: string; category: string }[]> {
  await requireAccess("drinks");
  return db.select({ itemId: drinkItems.id, category: drinkItems.category }).from(drinkItems);
}

export async function getDrinkCountItems(): Promise<{id:string;category:string;name:string;location:string;unit:string}[]> {
  await requireAccess("drinks");
  return db.select({id:drinkItems.id,category:drinkItems.category,name:products.name,location:drinkItems.location,unit:sql<string>`coalesce(${drinkItems.countUnit},${products.unit})`}).from(drinkItems).innerJoin(products,and(eq(products.id,drinkItems.productId),isNull(products.deletedAt))).where(eq(drinkItems.active,true)).orderBy(drinkItems.location,products.name);
}
