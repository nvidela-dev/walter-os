"use server";

import { randomUUID } from "node:crypto";

import { and, asc, count, desc, eq, gt, inArray, ne, notExists, type SQL, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import {
  invoiceLines,
  invoices,
  priceHistory,
  products,
  providerProducts,
  providers,
  type ProviderType,
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
import { getInvoiceDeleteBlock } from "@/lib/delete-guards";
import { multiplyDecimalStrings, sumDecimalStrings } from "@/lib/money";
import {
  isoDateSchema,
  moneySchema,
  optionalTextSchema,
  quantitySchema,
  uuidSchema,
} from "@/lib/validation";

const invoiceBaseSchema = z.object({
  providerId: uuidSchema,
  date: isoDateSchema,
  number: optionalTextSchema,
  notes: optionalTextSchema,
});

const invoiceProductSchema = invoiceBaseSchema.extend({
  lines: z
    .array(
      z.object({
        productId: uuidSchema,
        unitPrice: moneySchema,
        quantity: quantitySchema,
      })
    )
    .min(1, t.errors.invoice.needsAtLeastOneLine),
  amount: z.never().optional(),
});

const invoiceServiceSchema = invoiceBaseSchema.extend({
  amount: moneySchema,
  lines: z.never().optional(),
});

const createInvoiceSchema = z.union([invoiceProductSchema, invoiceServiceSchema]);

export type CreateInvoiceInput = z.input<typeof createInvoiceSchema>;

export interface InvoiceFormProduct {
  id: string;
  name: string;
  unitId: string;
  unitCode: string;
  currentPrice: string;
}

export interface InvoiceFormProvider {
  id: string;
  name: string;
  type: ProviderType;
  products: InvoiceFormProduct[];
}

export interface InvoiceListRow {
  id: string;
  providerId: string;
  providerName: string;
  date: string;
  number: string | null;
  total: string;
  paid: boolean;
}

export interface InvoiceLineDetail {
  id: string;
  productId: string;
  productName: string;
  unitId: string;
  unit: string;
  unitName: string;
  unitPrice: string;
  quantity: string;
  total: string;
}

export interface InvoiceDetail {
  id: string;
  providerId: string;
  providerName: string;
  date: string;
  number: string | null;
  amount: string | null;
  total: string;
  paid: boolean;
  notes: string | null;
  createdAt: Date;
  lines: InvoiceLineDetail[];
}

export interface PriceHistoryRow {
  id: string;
  providerId: string;
  providerName: string;
  price: string;
  unit: string;
  invoiceId: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  createdAt: Date;
}

export async function getInvoiceFormData(): Promise<InvoiceFormProvider[]> {
  const rows = await db
    .select({
      providerId: providers.id,
      providerName: providers.name,
      providerType: providers.type,
      productId: products.id,
      productName: products.name,
      unitId: products.unitId,
      unitCode: units.code,
      currentPrice: providerProducts.price,
    })
    .from(providers)
    .leftJoin(providerProducts, eq(providerProducts.providerId, providers.id))
    .leftJoin(products, eq(providerProducts.productId, products.id))
    .leftJoin(units, eq(products.unitId, units.id))
    .orderBy(asc(providers.name), asc(products.name));

  const grouped = new Map<string, InvoiceFormProvider>();

  for (const r of rows) {
    let entry = grouped.get(r.providerId);
    if (!entry) {
      entry = {
        id: r.providerId,
        name: r.providerName,
        type: r.providerType,
        products: [],
      };
      grouped.set(r.providerId, entry);
    }
    if (
      r.productId == null ||
      r.unitId == null ||
      r.productName == null ||
      r.unitCode == null ||
      r.currentPrice === null
    ) {
      continue;
    }
    entry.products.push({
      id: r.productId,
      name: r.productName,
      unitId: r.unitId,
      unitCode: r.unitCode,
      currentPrice: r.currentPrice,
    });
  }

  return [...grouped.values()];
}

export async function getInvoices(): Promise<InvoiceListRow[]> {
  return db
    .select({
      id: invoices.id,
      providerId: invoices.providerId,
      providerName: providers.name,
      date: invoices.date,
      number: invoices.number,
      total: invoices.total,
      paid: invoices.paid,
    })
    .from(invoices)
    .innerJoin(providers, eq(invoices.providerId, providers.id))
    .orderBy(desc(invoices.date), desc(invoices.createdAt));
}

export async function getInvoice(id: string): Promise<InvoiceDetail | null> {
  const [header] = await db
    .select({
      id: invoices.id,
      providerId: invoices.providerId,
      providerName: providers.name,
      date: invoices.date,
      number: invoices.number,
      amount: invoices.amount,
      total: invoices.total,
      paid: invoices.paid,
      notes: invoices.notes,
      createdAt: invoices.createdAt,
    })
    .from(invoices)
    .innerJoin(providers, eq(invoices.providerId, providers.id))
    .where(eq(invoices.id, id));

  if (!header) return null;

  const lines = await db
    .select({
      id: invoiceLines.id,
      productId: invoiceLines.productId,
      productName: products.name,
      unitId: invoiceLines.unitId,
      unit: units.code,
      unitName: units.name,
      unitPrice: invoiceLines.unitPrice,
      quantity: invoiceLines.quantity,
      total: invoiceLines.total,
    })
    .from(invoiceLines)
    .innerJoin(products, eq(invoiceLines.productId, products.id))
    .innerJoin(units, eq(invoiceLines.unitId, units.id))
    .where(eq(invoiceLines.invoiceId, id))
    .orderBy(invoiceLines.createdAt);

  return { ...header, lines };
}

export async function getProductPriceHistory(
  productId: string,
  opts?: { providerId?: string }
): Promise<PriceHistoryRow[]> {
  const conditions = [eq(priceHistory.productId, productId)];
  if (opts?.providerId != null) {
    conditions.push(eq(priceHistory.providerId, opts.providerId));
  }

  return db
    .select({
      id: priceHistory.id,
      providerId: priceHistory.providerId,
      providerName: providers.name,
      price: priceHistory.price,
      unit: units.code,
      invoiceId: priceHistory.invoiceId,
      invoiceNumber: invoices.number,
      invoiceDate: invoices.date,
      createdAt: priceHistory.createdAt,
    })
    .from(priceHistory)
    .innerJoin(providers, eq(priceHistory.providerId, providers.id))
    .innerJoin(units, eq(priceHistory.unitId, units.id))
    .leftJoin(invoices, eq(priceHistory.invoiceId, invoices.id))
    .where(and(...conditions))
    .orderBy(desc(priceHistory.createdAt));
}

export async function createInvoice(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = createInvoiceSchema.safeParse(input);
  if (!parsed.success) return unknownActionError(parsed.error);

  try {
    const provider = await getProviderForInvoice(parsed.data.providerId);
    if (!provider) return actionError(t.errors.provider.notFound);

    const invoiceId = randomUUID();

    if ("amount" in parsed.data && parsed.data.amount !== undefined) {
      if (provider.type !== "servicio") {
        return actionError(t.errors.invoice.serviceNeedsServiceProvider);
      }

      await db.insert(invoices).values({
        id: invoiceId,
        providerId: parsed.data.providerId,
        date: parsed.data.date,
        number: parsed.data.number,
        notes: parsed.data.notes,
        amount: parsed.data.amount,
        total: parsed.data.amount,
      });

      revalidateInvoicePaths(parsed.data.providerId);
      return actionOk({ id: invoiceId });
    }

    if (provider.type !== "producto") {
      return actionError(t.errors.invoice.productNeedsProductProvider);
    }

    const productIds = [...new Set(parsed.data.lines.map((line) => line.productId))];
    const catalogRows = await db
      .select({
        productId: providerProducts.productId,
        unitId: products.unitId,
        name: products.name,
      })
      .from(providerProducts)
      .innerJoin(products, eq(providerProducts.productId, products.id))
      .where(
        and(
          eq(providerProducts.providerId, parsed.data.providerId),
          inArray(providerProducts.productId, productIds)
        )
      );

    const productById = new Map(catalogRows.map((row) => [row.productId, row]));

    const linesWithTotals = parsed.data.lines.map((line) => {
      const product = productById.get(line.productId);
      if (product?.unitId == null) {
        throw expectedActionError(t.errors.invoice.lineProductNotForProvider);
      }
      return {
        ...line,
        unitId: product.unitId,
        total: multiplyDecimalStrings(line.unitPrice, line.quantity),
      };
    });

    const invoiceTotal = sumDecimalStrings(linesWithTotals.map((line) => line.total));

    const latestPerProduct = new Map<string, string>();
    for (const line of linesWithTotals) {
      latestPerProduct.set(line.productId, line.unitPrice);
    }

    const insertInvoice = db.insert(invoices).values({
      id: invoiceId,
      providerId: parsed.data.providerId,
      date: parsed.data.date,
      number: parsed.data.number,
      notes: parsed.data.notes,
      total: invoiceTotal,
    });

    const insertLines = db.insert(invoiceLines).values(
      linesWithTotals.map((line) => ({
        invoiceId,
        productId: line.productId,
        unitId: line.unitId,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
        total: line.total,
      }))
    );

    const insertHistory = db.insert(priceHistory).values(
      linesWithTotals.map((line) => ({
        productId: line.productId,
        providerId: parsed.data.providerId,
        price: line.unitPrice,
        unitId: line.unitId,
        invoiceId,
      }))
    );

    const priceUpdates = [...latestPerProduct.entries()].map(([productId, price]) =>
      db
        .update(providerProducts)
        .set({ price, updatedAt: new Date() })
        .where(
          and(
            eq(providerProducts.providerId, parsed.data.providerId),
            eq(providerProducts.productId, productId),
            notExists(
              db
                .select({ one: sql`1` })
                .from(invoices)
                .innerJoin(invoiceLines, eq(invoiceLines.invoiceId, invoices.id))
                .where(
                  and(
                    eq(invoices.providerId, parsed.data.providerId),
                    eq(invoiceLines.productId, productId),
                    gt(invoices.date, parsed.data.date),
                    ne(invoices.id, invoiceId)
                  )
                )
            )
          )
        )
    );

    await db.batch([insertInvoice, insertLines, insertHistory, ...priceUpdates]);

    revalidateInvoicePaths(parsed.data.providerId);
    return actionOk({ id: invoiceId });
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

async function getProviderForInvoice(
  id: string
): Promise<{ id: string; type: ProviderType } | null> {
  const [provider] = await db
    .select({ id: providers.id, type: providers.type })
    .from(providers)
    .where(eq(providers.id, id));
  return provider ?? null;
}

function revalidateInvoicePaths(providerId: string): void {
  revalidatePath("/invoices");
  revalidatePath(`/providers/${providerId}`);
}

async function countRows(table: PgTable, where: SQL | undefined): Promise<number> {
  const [row] = await db.select({ value: count() }).from(table).where(where);
  return row?.value ?? 0;
}
