import "server-only";

import { eq, notExists } from "drizzle-orm";

import { db } from "@/db";
import { products, providerProducts, providers } from "@/db/schema";
import { requireAccess } from "@/lib/auth/access";

export async function getDataFillQueue(): Promise<{ pending: { id: string; name: string; unit: string }[]; suppliers: { id: string; name: string }[] }> {
  await requireAccess("main");
  const [pending, suppliers] = await Promise.all([
    db.select({ id: products.id, name: products.name, unit: products.unit }).from(products)
      .where(notExists(db.select().from(providerProducts).where(eq(providerProducts.productId, products.id))))
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
