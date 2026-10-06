import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { fridgeProducts, fridges, products, providerProducts, providers } from "@/db/schema";
import { requireAccess } from "@/lib/auth/access";
import { getFridgeRunInventory, type InventoryRow } from "@/lib/queries/inventory";
import { getLatestInventoryRun } from "@/lib/queries/inventory-runs";
import { uuidSchema } from "@/lib/validation";

export interface ItemSuggestion { id: string; name: string }
export async function getInventoryItemSuggestions(): Promise<ItemSuggestion[]> {
  await requireAccess("inventory");
  return db.selectDistinct({ id: products.id, name: products.name }).from(products)
    .innerJoin(fridgeProducts, eq(fridgeProducts.productId, products.id))
    .innerJoin(fridges, eq(fridges.id, fridgeProducts.fridgeId))
    .where(and(eq(fridgeProducts.active, true), eq(fridges.active, true))).orderBy(products.name);
}

export interface InventoryItemDetail {
  name: string; day: string | null; initial: boolean; providers: string[];
  locations: { id: string; number: number; name: string | null; row: InventoryRow }[];
}
export async function getInventoryItemDetail(id: string): Promise<InventoryItemDetail | null> {
  await requireAccess("inventory");
  if (!uuidSchema.safeParse(id).success) return null;
  const [product] = await db.select({ name: products.name }).from(products).where(eq(products.id, id));
  if (product == null) return null;
  const [locations, suppliers, run] = await Promise.all([
    db.select({ id: fridges.id, number: fridges.number, name: fridges.name }).from(fridges)
      .innerJoin(fridgeProducts, eq(fridgeProducts.fridgeId, fridges.id))
      .where(and(eq(fridgeProducts.productId, id), eq(fridgeProducts.active, true), eq(fridges.active, true))).orderBy(fridges.number),
    db.select({ name: providers.name }).from(providers).innerJoin(providerProducts, eq(providerProducts.providerId, providers.id)).where(eq(providerProducts.productId, id)).orderBy(providers.name),
    getLatestInventoryRun(),
  ]);
  if (locations.length === 0) return null;
  const rows = await Promise.all(locations.map(async (location) => {
    const row = (await getFridgeRunInventory(location.id)).find((item) => item.id === id);
    return row == null ? null : { ...location, row };
  }));
  return { name: product.name, day: run?.day ?? null, initial: run?.initial ?? true, providers: suppliers.map((supplier) => supplier.name), locations: rows.filter((row) => row !== null) };
}
