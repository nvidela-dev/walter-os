"use server";

import { randomUUID } from "node:crypto";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { invoiceLines, invoices, priceHistory } from "@/db/schema";
import { t } from "@/i18n";
import { actionError, actionOk, type ActionResult, unknownActionError } from "@/lib/action-result";
import { countRows } from "@/lib/db/count-rows";
import { getInvoiceDeleteBlock } from "@/lib/delete-guards";
import { invoiceCreationRepository } from "@/lib/repositories/invoices";
import { createInvoiceUseCase } from "@/lib/use-cases/invoices/create-invoice";
import { uuidSchema } from "@/lib/validation";
import { createInvoiceSchema } from "@/lib/validators/invoices";

export async function createInvoice(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = createInvoiceSchema.safeParse(input);
  if (!parsed.success) return unknownActionError(parsed.error);

  try {
    const created = await createInvoiceUseCase(parsed.data, {
      ...invoiceCreationRepository,
      newId: randomUUID,
    });
    revalidateInvoicePaths(parsed.data.providerId);
    return actionOk(created);
  } catch (error) {
    return unknownActionError(error);
  }
}

export async function togglePaid(id: string): Promise<ActionResult<{ paid: boolean }>> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) return unknownActionError(parsedId.error);

  try {
    const [updated] = await db
      .update(invoices)
      .set({ paid: sql`NOT ${invoices.paid}`, updatedAt: new Date() })
      .where(eq(invoices.id, parsedId.data))
      .returning({ paid: invoices.paid });

    if (!updated) return actionError(t.errors.invoice.notFound);

    revalidatePath("/invoices");
    revalidatePath(`/invoices/${parsedId.data}`);
    return actionOk(updated);
  } catch (error) {
    return unknownActionError(error);
  }
}

export async function deleteInvoice(id: string): Promise<ActionResult> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) return unknownActionError(parsedId.error);

  try {
    const [lineCount, historyCount] = await Promise.all([
      countRows(invoiceLines, eq(invoiceLines.invoiceId, parsedId.data)),
      countRows(priceHistory, eq(priceHistory.invoiceId, parsedId.data)),
    ]);

    const blockMessage = getInvoiceDeleteBlock({ lines: lineCount, priceHistory: historyCount });
    if (blockMessage != null) return actionError(blockMessage);

    const [deleted] = await db
      .delete(invoices)
      .where(eq(invoices.id, parsedId.data))
      .returning({ providerId: invoices.providerId });

    if (!deleted) return actionError(t.errors.invoice.notFound);

    revalidateInvoicePaths(deleted.providerId);
    return actionOk(undefined);
  } catch (error) {
    return unknownActionError(error);
  }
}

function revalidateInvoicePaths(providerId: string): void {
  revalidatePath("/invoices");
  revalidatePath(`/providers/${providerId}`);
}
