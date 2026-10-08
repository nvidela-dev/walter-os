import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { fridgeProducts, fridges, inventoryTargetHistory, inventoryTargets, products } from "@/db/schema";
import { requireAccess } from "@/lib/auth/access";
import { uuidSchema } from "@/lib/validation";

export type InventoryTargetRevision = typeof inventoryTargetHistory.$inferSelect;
export interface InventoryTargetProduct {
  id: string; name: string; unit: string;
  target: { id: number; quantity: string; unit: string; recordedAt: Date } | null;
}

export async function getInventoryTargetProduct(id: string): Promise<InventoryTargetProduct | null> {
  await requireAccess("inventory");
  if (!uuidSchema.safeParse(id).success) return null;
  const [row] = await db.select({ id: products.id, name: products.name, unit: products.unit,
    targetId: inventoryTargetHistory.id, quantity: inventoryTargetHistory.quantity,
    targetUnit: inventoryTargetHistory.unit, recordedAt: inventoryTargetHistory.recordedAt,
  }).from(products)
    .innerJoin(fridgeProducts, and(eq(fridgeProducts.productId, products.id), eq(fridgeProducts.active, true)))
    .innerJoin(fridges, and(eq(fridges.id, fridgeProducts.fridgeId), eq(fridges.active, true)))
    .leftJoin(inventoryTargets, eq(inventoryTargets.productId, products.id))
    .leftJoin(inventoryTargetHistory, eq(inventoryTargetHistory.id, inventoryTargets.targetId))
    .where(eq(products.id, id)).limit(1);
  if (row == null) return null;
  return { id: row.id, name: row.name, unit: row.unit,
    target: row.targetId === null || row.quantity === null || row.targetUnit === null || row.recordedAt === null
      ? null : { id: row.targetId, quantity: row.quantity, unit: row.targetUnit, recordedAt: row.recordedAt },
  };
}

export async function getInventoryTargetHistory(id: string, page = 1): Promise<{ revisions: InventoryTargetRevision[]; hasNext: boolean }> {
  await requireAccess("inventory");
  uuidSchema.parse(id);
  if (!Number.isSafeInteger(page) || page < 1 || page > 1000000) throw new Error("Invalid target history page");
  const rows = await db.select().from(inventoryTargetHistory).where(eq(inventoryTargetHistory.productId, id))
    .orderBy(desc(inventoryTargetHistory.id)).limit(21).offset((page - 1) * 20);
  return { revisions: rows.slice(0, 20), hasNext: rows.length > 20 };
}
