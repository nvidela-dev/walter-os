import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { fridgeProducts, fridges, inventoryRunEntries, inventoryRuns, inventoryTargetHistory, inventoryTargets, products, providerProducts, providers } from "@/db/schema";
import { requireAccess } from "@/lib/auth/access";
import { compareStockToTarget, type PurchaseProduct } from "@/lib/inventory/purchases";

export interface PurchaseInventory { day: string | null; products: PurchaseProduct[] }

export async function getInventoryPurchases(): Promise<PurchaseInventory> {
  await requireAccess("inventory");
  const [run] = await db.select({ id: inventoryRuns.id, day: inventoryRuns.day }).from(inventoryRuns).orderBy(desc(inventoryRuns.day)).limit(1);
  // Pin all counts to this run even if a new weekly inventory starts during the read.
  const [rows, links] = await Promise.all([
    db.select({ id: products.id, name: products.name, unit: products.unit,
      quantity: inventoryRunEntries.quantity, countedUnit: inventoryRunEntries.unit,
      targetQuantity: inventoryTargetHistory.quantity, targetUnit: inventoryTargetHistory.unit,
    }).from(fridgeProducts)
      .innerJoin(fridges, and(eq(fridges.id, fridgeProducts.fridgeId), eq(fridges.active, true)))
      .innerJoin(products, eq(products.id, fridgeProducts.productId))
      .leftJoin(inventoryRunEntries, and(eq(inventoryRunEntries.runId, run?.id ?? -1), eq(inventoryRunEntries.fridgeId, fridgeProducts.fridgeId), eq(inventoryRunEntries.productId, products.id)))
      .leftJoin(inventoryTargets, eq(inventoryTargets.productId, products.id))
      .leftJoin(inventoryTargetHistory, eq(inventoryTargetHistory.id, inventoryTargets.targetId))
      .where(eq(fridgeProducts.active, true)).orderBy(products.name, products.id, fridges.number),
    db.selectDistinct({ productId: providerProducts.productId, id: providers.id, name: providers.name }).from(providerProducts)
      .innerJoin(providers, eq(providers.id, providerProducts.providerId))
      .innerJoin(fridgeProducts, and(eq(fridgeProducts.productId, providerProducts.productId), eq(fridgeProducts.active, true)))
      .innerJoin(fridges, and(eq(fridges.id, fridgeProducts.fridgeId), eq(fridges.active, true)))
      .orderBy(providers.name, providers.id),
  ]);
  const byProduct = new Map<string, typeof rows>();
  for (const row of rows) {
    const locations = byProduct.get(row.id) ?? [];
    locations.push(row);
    byProduct.set(row.id, locations);
  }
  return { day: run?.day ?? null, products: [...byProduct.values()].flatMap((locations) => {
    const first = locations[0];
    if (first === undefined) return [];
    const target = first.targetQuantity === null || first.targetUnit === null ? null : { quantity: first.targetQuantity, unit: first.targetUnit };
    return [{ id: first.id, name: first.name, unit: first.unit,
      comparison: compareStockToTarget(first.unit, locations.map((row) => row.quantity === null || row.countedUnit === null ? null : { quantity: row.quantity, unit: row.countedUnit }), target),
      suppliers: links.filter((link) => link.productId === first.id).map((link) => ({ id: link.id, name: link.name })),
    }];
  }) };
}
