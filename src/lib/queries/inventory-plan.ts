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
}

export async function getInventoryPlan(): Promise<InventoryPlanItem[]> {
  await requireAccess("main");
  return db.selectDistinct({
    id: products.id, name: products.name, unit: products.unit,
    quantity: inventoryTargetHistory.quantity,
    targetUnit: inventoryTargetHistory.unit,
    targetId: inventoryTargetHistory.id,
  }).from(products)
    .innerJoin(fridgeProducts, and(eq(fridgeProducts.productId, products.id), eq(fridgeProducts.active, true)))
    .innerJoin(fridges, and(eq(fridges.id, fridgeProducts.fridgeId), eq(fridges.active, true)))
    .leftJoin(inventoryTargets, eq(inventoryTargets.productId, products.id))
    .leftJoin(inventoryTargetHistory, eq(inventoryTargetHistory.id, inventoryTargets.targetId))
    .orderBy(products.name, products.id);
}
