import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { fridgeProducts, fridges, inventoryTargetHistory, inventoryTargets, products } from "@/db/schema";
import { requireAccess } from "@/lib/auth/access";

export interface InventoryPlanItem {
  id: string;
  name: string;
  unit: string;
  quantity: string | null;
  targetUnit: string | null;
  targetId: number | null;
  locations: { id: string; number: number; name: string | null }[];
}

export async function getInventoryPlan(): Promise<InventoryPlanItem[]> {
  await requireAccess("main");
  const rows = await db.select({
    id: products.id, name: products.name, unit: products.unit,
    fridgeId: fridges.id, fridgeNumber: fridges.number, fridgeName: fridges.name,
    quantity: inventoryTargetHistory.quantity,
    targetUnit: inventoryTargetHistory.unit,
    targetId: inventoryTargetHistory.id,
  }).from(products)
    .innerJoin(fridgeProducts, and(eq(fridgeProducts.productId, products.id), eq(fridgeProducts.active, true)))
    .innerJoin(fridges, and(eq(fridges.id, fridgeProducts.fridgeId), eq(fridges.active, true)))
    .leftJoin(inventoryTargets, eq(inventoryTargets.productId, products.id))
    .leftJoin(inventoryTargetHistory, eq(inventoryTargetHistory.id, inventoryTargets.targetId))
    .orderBy(fridges.number, products.name, products.id);
  const items = new Map<string, InventoryPlanItem>();
  for (const { fridgeId, fridgeNumber, fridgeName, ...product } of rows) {
    const item = items.get(product.id) ?? { ...product, locations: [] };
    item.locations.push({ id: fridgeId, number: fridgeNumber, name: fridgeName });
    items.set(product.id, item);
  }
  return [...items.values()];
}
