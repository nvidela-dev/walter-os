import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { fridgeProducts, fridges, productMatches, products, providerProducts, providers } from "@/db/schema";
import { requireAccess } from "@/lib/auth/access";
import type { CatalogueProduct, MatchDecision, MatchProduct } from "@/lib/product-matching";

export async function getProductMatching(): Promise<{ inventory: MatchProduct[]; catalogue: CatalogueProduct[]; decisions: MatchDecision[] }> {
  await requireAccess("main");
  const [inventory, rows, decisions] = await Promise.all([
    db.selectDistinct({ id: products.id, name: products.name, unit: products.unit, deletedAt: products.deletedAt }).from(products)
      .innerJoin(fridgeProducts, and(eq(fridgeProducts.productId, products.id), eq(fridgeProducts.active, true)))
      .innerJoin(fridges, and(eq(fridges.id, fridgeProducts.fridgeId), eq(fridges.active, true))).orderBy(products.name),
    db.select({ id: products.id, name: products.name, unit: products.unit, provider: providers.name, deletedAt: products.deletedAt }).from(products)
      .innerJoin(providerProducts, eq(products.id, providerProducts.productId))
      .innerJoin(providers, eq(providers.id, providerProducts.providerId)).orderBy(products.name, providers.name),
    db.select({ inventoryId: productMatches.inventoryId, catalogueId: productMatches.catalogueId, status: productMatches.status }).from(productMatches),
  ]);
  const catalogue = Array.from(new Map(rows.map(row => [row.id, { ...row, provider: rows.filter(r => r.id === row.id).map(r => r.provider.trim()).join(", ") }])).values());
  return { inventory: inventory.map(p => ({ ...p, deletedAt: p.deletedAt?.toISOString() ?? null })), catalogue: catalogue.map(p => ({ ...p, deletedAt: p.deletedAt?.toISOString() ?? null })), decisions };
}
