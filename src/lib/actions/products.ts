"use server";

import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  fridgeProducts,
  invoiceLines,
  priceHistory,
  products,
  providerProducts,
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
import { requireAccess } from "@/lib/auth/access";
import { countRows } from "@/lib/db/count-rows";
import { getProductDeleteBlock } from "@/lib/delete-guards";
import { getProvider } from "@/lib/queries/providers";
import {
  createProductForProviderInputSchema,
  linkExistingProductSchema,
  productProviderInputSchema,
  updateProductInputSchema,
  updateProductPriceInputSchema,
} from "@/lib/validators/providers";

export async function createProductForProvider(
  providerId: string,
  productData: unknown,
  price: string,
  quantity: string
): Promise<ActionResult<{ id: string; name: string; unitId: string; unit: string }>> {
  await requireAccess("main");
  const parsed = createProductForProviderInputSchema.safeParse({
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
  await requireAccess("main");
  const parsed = updateProductPriceInputSchema.safeParse({ providerId, productId, price });
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

export async function updateProduct(
  providerId: string,
  productId: string,
  data: unknown
): Promise<ActionResult> {
  await requireAccess("main");
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
    revalidatePath("/inventory", "layout");
    return actionOk(undefined);
  } catch (error) {
    return unknownActionError(error);
  }
}

export async function removeProductFromProvider(
  providerId: string,
  productId: string
): Promise<ActionResult> {
  await requireAccess("main");
  const parsed = productProviderInputSchema.safeParse({ providerId, productId });
  if (!parsed.success) return unknownActionError(parsed.error);

  try {
    const inventoryUses = await countRows(fridgeProducts, eq(fridgeProducts.productId, parsed.data.productId));
    if (inventoryUses > 0) return actionError(t.inventory.productTracked);
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

export async function linkExistingProduct(input: unknown): Promise<ActionResult> {
  await requireAccess("main");
  try {
    const data = linkExistingProductSchema.parse(input);
    const provider = await getProvider(data.providerId);
    if (provider?.type !== "producto") return actionError(t.errors.provider.onlyProductProviders);
    const [product] = await db.select().from(products).where(eq(products.id, data.productId));
    if (product?.unitId == null) return actionError(t.errors.product.selectValidUnit);
    const [existing] = await db.select().from(providerProducts).where(and(
      eq(providerProducts.providerId, data.providerId), eq(providerProducts.productId, data.productId),
    ));
    if (existing) return actionError(t.inventory.alreadyLinked);
    await db.batch([
      db.insert(providerProducts).values(data),
      db.insert(priceHistory).values({ productId: data.productId, providerId: data.providerId, price: data.price, unitId: product.unitId }),
    ]);
    revalidatePath(`/providers/${data.providerId}`);
    revalidatePath("/inventory", "layout");
    return actionOk(undefined);
  } catch (error) { return unknownActionError(error); }
}
