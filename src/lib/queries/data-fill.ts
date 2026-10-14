import "server-only";

import { and, eq, exists,isNull,notExists } from "drizzle-orm";

import { db } from "@/db";
import { drinkItems, products, providerProducts, providers } from "@/db/schema";
import { requireAccess } from "@/lib/auth/access";

export async function getDataFillQueue(drinksOnly = false): Promise<{ pending: { id: string; name: string; unit: string }[]; suppliers: { id: string; name: string }[] }> {
  await requireAccess("main");
  const [pending, suppliers] = await Promise.all([
    db.select({ id: products.id, name: products.name, unit: products.unit }).from(products)
      .where(and(isNull(products.deletedAt), notExists(db.select().from(providerProducts).where(eq(providerProducts.productId, products.id))),
        drinksOnly ? exists(db.select().from(drinkItems).where(and(eq(drinkItems.productId, products.id), eq(drinkItems.active, true)))) : undefined))
      .orderBy(products.name),
    db.select({ id: providers.id, name: providers.name }).from(providers)
      .where(eq(providers.type, "producto")).orderBy(providers.name),
  ]);
  // Shuffle on each visit; each canonical product appears only once.
  for (let i = pending.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = pending[i];
    const b = pending[j];
    if (a !== undefined && b !== undefined) [pending[i], pending[j]] = [b, a];
  }
  return { pending, suppliers };
}
