import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  invoiceLines,
  invoices,
  priceHistory,
  products,
  providerProducts,
  providers,
  units,
} from "@/db/schema";
import type {
  InvoiceDetail,
  InvoiceFormProvider,
  InvoiceListRow,
  PriceHistoryRow,
} from "@/lib/types/invoices";
import { parseUuidOrNull } from "@/lib/validation";

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

  for (const row of rows) {
    let entry = grouped.get(row.providerId);
    if (!entry) {
      entry = {
        id: row.providerId,
        name: row.providerName,
        type: row.providerType,
        products: [],
      };
      grouped.set(row.providerId, entry);
    }
    if (
      row.productId == null ||
      row.unitId == null ||
      row.productName == null ||
      row.unitCode == null ||
      row.currentPrice === null
    ) {
      continue;
    }
    entry.products.push({
      id: row.productId,
      name: row.productName,
      unitId: row.unitId,
      unitCode: row.unitCode,
      currentPrice: row.currentPrice,
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
  const parsedId = parseUuidOrNull(id);
  if (parsedId === null) return null;

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
    .where(eq(invoices.id, parsedId));

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
    .where(eq(invoiceLines.invoiceId, parsedId))
    .orderBy(invoiceLines.createdAt);

  return { ...header, lines };
}

export async function getProductPriceHistory(
  productId: string,
  opts?: { providerId?: string }
): Promise<PriceHistoryRow[]> {
  const parsedProductId = parseUuidOrNull(productId);
  if (parsedProductId === null) return [];

  const conditions = [eq(priceHistory.productId, parsedProductId)];
  if (opts?.providerId != null) {
    const parsedProviderId = parseUuidOrNull(opts.providerId);
    if (parsedProviderId === null) return [];
    conditions.push(eq(priceHistory.providerId, parsedProviderId));
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
