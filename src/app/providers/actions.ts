"use server";

import { randomUUID } from "node:crypto";

import { and, count, eq, type SQL } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import {
  invoiceLines,
  invoices,
  priceHistory,
  products,
  type Provider,
  providerProducts,
  providers,
  type ProviderType,
  recipeProducts,
  units,
} from "@/db/schema";
import { t } from "@/i18n";
import {
  actionError,
  actionOk,
  type ActionResult,
  expectedActionError,
  unknownActionError,
} from "@/lib/action-result";
import { getProductDeleteBlock, getProviderDeleteBlock } from "@/lib/delete-guards";
import {
  moneySchema,
  nonNegativeMoneySchema,
  optionalTextSchema,
  providerDaysSchema,
  providerTypeSchema,
  quantitySchema,
  requiredTextSchema,
  uuidSchema,
} from "@/lib/validation";

const providerInputSchema = z.object({
  name: requiredTextSchema,
  description: optionalTextSchema,
  type: providerTypeSchema,
  days: providerDaysSchema,
});

const debtInputSchema = z.object({
  debt: nonNegativeMoneySchema,
});

const createProductInputSchema = z.object({
  providerId: uuidSchema,
  productData: z.object({
    name: requiredTextSchema,
    description: optionalTextSchema,
    unitId: uuidSchema,
  }),
  price: moneySchema,
  quantity: quantitySchema,
});

const updateProductInputSchema = z.object({
  providerId: uuidSchema,
  productId: uuidSchema,
  data: z.object({
    name: requiredTextSchema,
    unitId: uuidSchema,
    price: moneySchema,
  }),
});

const productProviderInputSchema = z.object({
  providerId: uuidSchema,
  productId: uuidSchema,
});

export type ProviderInput = z.infer<typeof providerInputSchema>;
export type ProviderDebtInput = z.infer<typeof debtInputSchema>;

export interface ProviderListRow {
  id: string;
  name: string;
  description: string | null;
  type: ProviderType;
  days: string | null;
  debt: string;
  productCount: number;
}

export interface ProviderProduct {
  id: string;
  productId: string;
  price: string;
  quantity: string;
  name: string;
  unitId: string | null;
  unit: string;
  unitName: string;
  description: string | null;
}

export interface ProductForProvider {
  id: string;
  name: string;
  unitId: string | null;
  unit: string;
  unitName: string;
  description: string | null;
  price: string;
}

export async function getUnits(): Promise<{ id: string; code: string; name: string }[]> {
  return db
    .select({ id: units.id, code: units.code, name: units.name })
    .from(units)
    .orderBy(units.name);
}

export async function getProviders(): Promise<ProviderListRow[]> {
  const result = await db
    .select({
      id: providers.id,
      name: providers.name,
      description: providers.description,
      type: providers.type,
      days: providers.days,
      debt: providers.debt,
      productCount: count(providerProducts.productId),
    })
    .from(providers)
    .leftJoin(providerProducts, eq(providers.id, providerProducts.providerId))
    .groupBy(providers.id)
    .orderBy(providers.name);

  return result;
}

export async function getProvider(id: string): Promise<Provider | null> {
  const result = await db.select().from(providers).where(eq(providers.id, id));
  return result[0] ?? null;
}

export async function getProviderWithProducts(
  id: string
): Promise<(Provider & { products: ProviderProduct[] }) | null> {
  const provider = await getProvider(id);
  if (!provider) return null;

  const linkedProducts = await db
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
    .where(eq(providerProducts.providerId, id));

  return { ...provider, products: linkedProducts };
}

export async function createProvider(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = providerInputSchema.safeParse(input);
  if (!parsed.success) return unknownActionError(parsed.error);

  try {
    const [created] = await db.insert(providers).values(parsed.data).returning({ id: providers.id });
    if (!created) return actionError(t.errors.provider.createFailed);
    revalidatePath("/providers");
    return actionOk(created);
  } catch (error) {
    return unknownActionError(error);
  }
}

export async function updateProvider(
  id: string,
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) return unknownActionError(parsedId.error);

  const parsed = providerInputSchema.safeParse(input);
  if (!parsed.success) return unknownActionError(parsed.error);

  try {
    const [updated] = await db
      .update(providers)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(providers.id, parsedId.data))
      .returning({ id: providers.id });

    if (!updated) return actionError(t.errors.provider.notFound);

    revalidatePath("/providers");
    revalidatePath(`/providers/${parsedId.data}`);
    return actionOk(updated);
  } catch (error) {
    return unknownActionError(error);
  }
}

export async function updateProviderDebt(
  id: string,
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) return unknownActionError(parsedId.error);

  const parsed = debtInputSchema.safeParse(input);
  if (!parsed.success) return unknownActionError(parsed.error);

  try {
    const [updated] = await db
      .update(providers)
      .set({ debt: parsed.data.debt, updatedAt: new Date() })
      .where(eq(providers.id, parsedId.data))
      .returning({ id: providers.id });

    if (!updated) return actionError(t.errors.provider.notFound);

    revalidatePath("/providers");
    revalidatePath(`/providers/${parsedId.data}`);
    return actionOk(updated);
  } catch (error) {
    return unknownActionError(error);
  }
}

export async function deleteProvider(id: string): Promise<ActionResult> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) return unknownActionError(parsedId.error);

  try {
    const [productLinks, invoiceCount, priceHistoryCount] = await Promise.all([
      countRows(providerProducts, eq(providerProducts.providerId, parsedId.data)),
      countRows(invoices, eq(invoices.providerId, parsedId.data)),
      countRows(priceHistory, eq(priceHistory.providerId, parsedId.data)),
    ]);

    const blockMessage = getProviderDeleteBlock({
      products: productLinks,
      invoices: invoiceCount,
      priceHistory: priceHistoryCount,
    });
    if (blockMessage != null) return actionError(blockMessage);

    const [deleted] = await db
      .delete(providers)
      .where(eq(providers.id, parsedId.data))
      .returning({ id: providers.id });

    if (!deleted) return actionError(t.errors.provider.notFound);

    revalidatePath("/providers");
    return actionOk(undefined);
  } catch (error) {
    return unknownActionError(error);
  }
}

export async function createProductForProvider(
  providerId: string,
  productData: unknown,
  price: string,
  quantity: string
): Promise<ActionResult<{ id: string; name: string; unitId: string; unit: string }>> {
  const parsed = createProductInputSchema.safeParse({
    providerId,
    productData,
    price,
    quantity,
  });
  if (!parsed.success) return unknownActionError(parsed.error);

  try {
    const provider = await getProvider(parsed.data.providerId);
    if (!provider) return actionError(t.errors.provider.notFound);
    if (provider.type !== "producto") {
      return actionError(t.errors.provider.onlyProductProviders);
    }

    const unit = await getUnitOrThrow(parsed.data.productData.unitId);
    const productId = randomUUID();
    const product = {
      id: productId,
      name: parsed.data.productData.name,
      description: parsed.data.productData.description,
      unitId: unit.id,
      unit: unit.code,
    };

    await db.batch([
      db.insert(products).values(product),
      db.insert(providerProducts).values({
        providerId: parsed.data.providerId,
        productId,
        price: parsed.data.price,
        quantity: parsed.data.quantity,
      }),
      db.insert(priceHistory).values({
        productId,
        providerId: parsed.data.providerId,
        price: parsed.data.price,
        unitId: unit.id,
      }),
    ]);

    revalidatePath(`/providers/${parsed.data.providerId}`);
    return actionOk({
      id: product.id,
      name: product.name,
      unitId: unit.id,
      unit: unit.code,
    });
  } catch (error) {
    return unknownActionError(error);
  }
}

export async function updateProductPrice(
  providerId: string,
  productId: string,
  price: string
): Promise<ActionResult> {
  const parsed = productProviderInputSchema.extend({ price: moneySchema }).safeParse({
    providerId,
    productId,
    price,
  });
  if (!parsed.success) return unknownActionError(parsed.error);

  try {
    const [product] = await db
      .select({ unitId: products.unitId })
      .from(products)
      .where(eq(products.id, parsed.data.productId));

    if (product?.unitId == null) return actionError(t.errors.product.notFound);

    const [updated] = await db
      .update(providerProducts)
      .set({ price: parsed.data.price, updatedAt: new Date() })
      .where(
        and(
          eq(providerProducts.providerId, parsed.data.providerId),
          eq(providerProducts.productId, parsed.data.productId)
        )
      )
      .returning({ productId: providerProducts.productId });

    if (!updated) return actionError(t.errors.product.notFoundForProvider);

    await recordPriceChange({
      productId: parsed.data.productId,
      providerId: parsed.data.providerId,
      price: parsed.data.price,
      unitId: product.unitId,
    });

    revalidatePath(`/providers/${parsed.data.providerId}`);
    return actionOk(undefined);
  } catch (error) {
    return unknownActionError(error);
  }
}

export async function getProductForProvider(
  providerId: string,
  productId: string
): Promise<ProductForProvider | null> {
  const result = await db
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
        eq(providerProducts.providerId, providerId),
        eq(providerProducts.productId, productId)
      )
    );
  return result[0] ?? null;
}

export async function updateProduct(
  providerId: string,
  productId: string,
  data: unknown
): Promise<ActionResult> {
  const parsed = updateProductInputSchema.safeParse({ providerId, productId, data });
  if (!parsed.success) return unknownActionError(parsed.error);

  try {
    const unit = await getUnitOrThrow(parsed.data.data.unitId);

    const [existing] = await db
      .select({ productId: providerProducts.productId })
      .from(providerProducts)
      .where(
        and(
          eq(providerProducts.providerId, parsed.data.providerId),
          eq(providerProducts.productId, parsed.data.productId)
        )
      );

    if (!existing) return actionError(t.errors.product.notFoundForProvider);

    await db.batch([
      db
        .update(products)
        .set({
          name: parsed.data.data.name,
          unitId: unit.id,
          unit: unit.code,
          updatedAt: new Date(),
        })
        .where(eq(products.id, parsed.data.productId)),
      db
        .update(providerProducts)
        .set({ price: parsed.data.data.price, updatedAt: new Date() })
        .where(
          and(
            eq(providerProducts.providerId, parsed.data.providerId),
            eq(providerProducts.productId, parsed.data.productId)
          )
        ),
      db.insert(priceHistory).values({
        productId: parsed.data.productId,
        providerId: parsed.data.providerId,
        price: parsed.data.data.price,
        unitId: unit.id,
      }),
    ]);

    revalidatePath(`/providers/${parsed.data.providerId}`);
    revalidatePath(`/providers/${parsed.data.providerId}/products/${parsed.data.productId}`);
    return actionOk(undefined);
  } catch (error) {
    return unknownActionError(error);
  }
}

export async function removeProductFromProvider(
  providerId: string,
  productId: string
): Promise<ActionResult> {
  const parsed = productProviderInputSchema.safeParse({ providerId, productId });
  if (!parsed.success) return unknownActionError(parsed.error);

  try {
    const [invoiceLineCount, priceHistoryCount, recipeUses] = await Promise.all([
      countRows(invoiceLines, eq(invoiceLines.productId, parsed.data.productId)),
      countRows(priceHistory, eq(priceHistory.productId, parsed.data.productId)),
      countRows(recipeProducts, eq(recipeProducts.productId, parsed.data.productId)),
    ]);

    const blockMessage = getProductDeleteBlock({
      invoiceLines: invoiceLineCount,
      priceHistory: priceHistoryCount,
      recipes: recipeUses,
    });
    if (blockMessage != null) return actionError(blockMessage);

    await db.batch([
      db
        .delete(providerProducts)
        .where(
          and(
            eq(providerProducts.providerId, parsed.data.providerId),
            eq(providerProducts.productId, parsed.data.productId)
          )
        ),
      db.delete(products).where(eq(products.id, parsed.data.productId)),
    ]);

    revalidatePath(`/providers/${parsed.data.providerId}`);
    return actionOk(undefined);
  } catch (error) {
    return unknownActionError(error);
  }
}

async function getUnitOrThrow(unitId: string): Promise<{ id: string; code: string }> {
  const [unit] = await db
    .select({ id: units.id, code: units.code })
    .from(units)
    .where(eq(units.id, unitId));
  if (!unit) throw expectedActionError(t.errors.product.selectValidUnit);
  return unit;
}

async function recordPriceChange(args: {
  productId: string;
  providerId: string;
  price: string;
  unitId: string;
  invoiceId?: string;
}): Promise<void> {
  await db.insert(priceHistory).values(args);
}

async function countRows(table: PgTable, where: SQL | undefined): Promise<number> {
  const [row] = await db.select({ value: count() }).from(table).where(where);
  return row?.value ?? 0;
}
