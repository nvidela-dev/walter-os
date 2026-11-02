import "server-only";

import Decimal from "decimal.js";
import { eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { drinkItems, products as catalogueProducts } from "@/db/schema";
import { requireAccess } from "@/lib/auth/access";
import { compareStockToTarget, type PurchaseProduct } from "@/lib/inventory/purchases";
import { getDrinkDocument } from "@/lib/queries/drink-documents";
import { getDrinkSuppliers } from "@/lib/queries/drinks";

export async function getDrinkPurchases(id: string): Promise<{ day: string; category: string; products: PurchaseProduct[] } | null> {
  await requireAccess("drinks");
  const result = await getDrinkDocument(id);
  if (!result) return null;
  // Counts and per-location targets must be aggregated by canonical product identity.
  const [items, suppliers] = await Promise.all([db.select({ id: drinkItems.id, productId: drinkItems.productId, category: drinkItems.category, active: drinkItems.active, location: drinkItems.location, countUnit: drinkItems.countUnit, targetQuantity: drinkItems.targetQuantity, targetUnit: drinkItems.targetUnit, name: catalogueProducts.name, productUnit: catalogueProducts.unit }).from(drinkItems).innerJoin(catalogueProducts, eq(catalogueProducts.id, drinkItems.productId)).where(isNull(catalogueProducts.deletedAt)), getDrinkSuppliers()]);
  const countedItems = [...result.document.items];
  for (const item of items.filter(row => row.active && row.category === result.document.category)) {
    if (!countedItems.some(entry => entry.itemId === item.id)) {
      countedItems.push({ itemId: item.id, name: item.name, location: item.location, unit: item.countUnit ?? item.productUnit, quantity: null });
    }
  }
  const grouped = new Map<string, typeof result.document.items>();
  for (const entry of countedItems) {
    const item = items.find(row => row.id === entry.itemId);
    const key = item?.productId ?? entry.itemId;
    grouped.set(key, [...(grouped.get(key) ?? []), entry]);
  }
  const products: PurchaseProduct[] = [...grouped].map(([id, entries]) => {
    const first = entries[0];
    if (first === undefined) throw new Error("Empty product group");
    const targets = entries.map(entry => items.find(item => item.id === entry.itemId));
    const allTargets = targets.every(item => item?.targetQuantity !== null && item?.targetQuantity !== undefined && item.targetUnit === first.unit);
    const comparison = compareStockToTarget(first.unit, entries.map(entry => entry.quantity === null ? null : { quantity: entry.quantity, unit: entry.unit }), allTargets ? { quantity: targets.reduce((sum, item) => sum.plus(item?.targetQuantity ?? "0"), new Decimal(0)).toString(), unit: first.unit } : null);
    if (targets.some(item => item?.targetUnit != null && item.targetUnit !== first.unit) && !comparison.issues.includes("unit-mismatch")) { comparison.issues.push("unit-mismatch"); comparison.shortage = null; }
    const links = suppliers.filter(link => entries.some(entry => entry.itemId === link.itemId));
    return { id, name: first.name, unit: first.unit, comparison, suppliers: [...new Map(links.map(link => [link.providerId, { id: link.providerId, name: link.name }])).values()] };
  });
  return { day: result.document.date, category: result.document.category, products };
}
