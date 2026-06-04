"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { invoices, priceHistory, providerProducts, providers } from "@/db/schema";
import { t } from "@/i18n";
import { actionError, actionOk, type ActionResult, unknownActionError } from "@/lib/action-result";
import { countRows } from "@/lib/db/count-rows";
import { getProviderDeleteBlock } from "@/lib/delete-guards";
import { uuidSchema } from "@/lib/validation";
import { providerDebtInputSchema, providerInputSchema } from "@/lib/validators/providers";

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

  const parsed = providerDebtInputSchema.safeParse(input);
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
