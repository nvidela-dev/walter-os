import "server-only";

import { and, eq, notExists } from "drizzle-orm";

import { db } from "@/db";
import { products, providerProducts, units } from "@/db/schema";
import { requireAccess } from "@/lib/auth/access";
import type { ProductForProvider } from "@/lib/types/providers";
import { parseUuidOrNull } from "@/lib/validation";

export async function getProductForProvider(
  providerId: string,
  productId: string
): Promise<ProductForProvider | null> {
  const parsedProviderId = parseUuidOrNull(providerId);
  const parsedProductId = parseUuidOrNull(productId);
  if (parsedProviderId === null || parsedProductId === null) return null;

  const [product] = await db
    .select({
      id: products.id,
      name: products.name,
      unitId: products.unitId,
      unit: units.code,
      unitName: units.name,
      description: products.description,
      price: providerProducts.price,
    })
    .from(providerProducts)
    .innerJoin(products, eq(providerProducts.productId, products.id))
    .innerJoin(units, eq(products.unitId, units.id))
    .where(
      and(
        eq(providerProducts.providerId, parsedProviderId),
        eq(providerProducts.productId, parsedProductId)
      )
    );

  return product ?? null;
}

export async function getUnlinkedProducts(providerId: string): Promise<{ id: string; name: string; unit: string }[]> {
  await requireAccess("main");
  const parsedProviderId = parseUuidOrNull(providerId);
  if (parsedProviderId === null) return [];
  return db.select({ id: products.id, name: products.name, unit: products.unit }).from(products)
    .where(notExists(db.select().from(providerProducts).where(and(
      eq(providerProducts.providerId, parsedProviderId), eq(providerProducts.productId, products.id),
    )))).orderBy(products.name);
}
