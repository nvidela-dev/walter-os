import "server-only";

import { count, eq } from "drizzle-orm";

import { db } from "@/db";
import { products, providerProducts, providers, units } from "@/db/schema";
import type {
  ProviderDetail,
  ProviderListRow,
  ProviderProductView,
  ProviderView,
} from "@/lib/types/providers";
import { parseUuidOrNull } from "@/lib/validation";

const providerSelection = {
  id: providers.id,
  name: providers.name,
  description: providers.description,
  type: providers.type,
  days: providers.days,
  debt: providers.debt,
};

export async function getProviders(): Promise<ProviderListRow[]> {
  return db
    .select({
      ...providerSelection,
      productCount: count(providerProducts.productId),
    })
    .from(providers)
    .leftJoin(providerProducts, eq(providers.id, providerProducts.providerId))
    .groupBy(providers.id)
    .orderBy(providers.name);
}

export async function getProvider(id: string): Promise<ProviderView | null> {
  const parsedId = parseUuidOrNull(id);
  if (parsedId === null) return null;

  const [provider] = await db
    .select(providerSelection)
    .from(providers)
    .where(eq(providers.id, parsedId));
  return provider ?? null;
}

export async function getProviderWithProducts(id: string): Promise<ProviderDetail | null> {
  const provider = await getProvider(id);
  if (!provider) return null;

  const linkedProducts: ProviderProductView[] = await db
    .select({
      id: products.id,
      productId: providerProducts.productId,
      price: providerProducts.price,
      quantity: providerProducts.quantity,
      name: products.name,
      unitId: products.unitId,
      unit: units.code,
      unitName: units.name,
      description: products.description,
    })
    .from(providerProducts)
    .innerJoin(products, eq(providerProducts.productId, products.id))
    .innerJoin(units, eq(products.unitId, units.id))
    .where(eq(providerProducts.providerId, provider.id));

  return { ...provider, products: linkedProducts };
}
