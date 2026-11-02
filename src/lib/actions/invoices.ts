"use server";

import { createHash, randomUUID } from "node:crypto";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { invoiceLines, invoices, priceHistory } from "@/db/schema";
import { t } from "@/i18n";
import { actionError, actionOk, type ActionResult, unknownActionError } from "@/lib/action-result";
import { requireAccess } from "@/lib/auth/access";
import { countRows } from "@/lib/db/count-rows";
import { getInvoiceDeleteBlock } from "@/lib/delete-guards";
import { reviewedTotalMatches } from "@/lib/invoice-photo/review";
import { invoiceCreationRepository } from "@/lib/repositories/invoices";
import { createInvoiceUseCase } from "@/lib/use-cases/invoices/create-invoice";
import { uuidSchema } from "@/lib/validation";
import { createInvoiceSchema } from "@/lib/validators/invoices";

const submissionSchema = z.object({
  submissionId: uuidSchema,
  reviewedTotal: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
});

export async function createInvoice(input: unknown, submission?: unknown): Promise<ActionResult<{ id: string }>> {
  const actor = await requireAccess("main");
  const parsed = createInvoiceSchema.safeParse(input);
  if (!parsed.success) return unknownActionError(parsed.error);
  const request = submission === undefined ? undefined : submissionSchema.safeParse(submission);
  if (request !== undefined && !request.success) return unknownActionError(request.error);
  const options = request?.data;
  // Actor-scoped deterministic UUID: concurrent retries collide on the existing PK,
  // rolling back the entire product/history batch. No second invoice or price history.
  const digest = options === undefined ? null : createHash("sha256").update(`${actor}:${options.submissionId}`).digest("hex");
  const invoiceId = digest === null ? randomUUID() : `${digest.slice(0, 8)}-${digest.slice(8, 12)}-4${digest.slice(13, 16)}-a${digest.slice(17, 20)}-${digest.slice(20, 32)}`;
  const existing = async (): Promise<{ id: string } | undefined> => {
    const [row] = await db.select({ id: invoices.id }).from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
    return row;
  };
  try {
    const previous = await existing();
    if (previous !== undefined) return actionOk(previous);
    if (options?.reviewedTotal !== undefined && !reviewedTotalMatches(parsed.data.amount ?? parsed.data.lines, options.reviewedTotal)) {
      return actionError("El total revisado no coincide con los importes de la factura.");
    }
    if (parsed.data.number !== null) {
      const [duplicate] = await db.select({ id: invoices.id }).from(invoices).where(and(
        eq(invoices.providerId, parsed.data.providerId),
        sql`lower(trim(${invoices.number})) = lower(trim(${parsed.data.number}))`,
        eq(invoices.date, parsed.data.date),
      )).limit(1);
      if (duplicate !== undefined) return actionError("Ya existe una factura de este proveedor con la misma fecha y número. Revisá Facturas antes de volver a cargarla.");
    }
    const created = await createInvoiceUseCase(parsed.data, {
      ...invoiceCreationRepository,
      newId: () => invoiceId,
    });
    revalidateInvoicePaths(parsed.data.providerId);
    return actionOk(created);
  } catch (error) {
    // A lost response or concurrent retry may already have committed successfully.
    const previous = await existing().catch(() => undefined);
    if (previous !== undefined) return actionOk(previous);
    return unknownActionError(error);
  }
}

export async function togglePaid(id: string): Promise<ActionResult<{ paid: boolean }>> {
  await requireAccess("main");
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
  await requireAccess("main");
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
