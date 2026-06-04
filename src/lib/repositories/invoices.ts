import "server-only";

import { and, eq, gt, inArray, ne, notExists, sql } from "drizzle-orm";

import { db } from "@/db";
import { invoiceLines, invoices, priceHistory, products, providerProducts, providers } from "@/db/schema";
import type { ProviderType } from "@/lib/types/providers";

export interface InvoiceProviderRecord {
  id: string;
  type: ProviderType;
}

export interface InvoiceCatalogProduct {
  productId: string;
  unitId: string | null;
}

export interface ServiceInvoiceRecord {
  id: string;
  providerId: string;
  date: string;
  number: string | null;
  notes: string | null;
  amount: string;
}

export interface ProductInvoiceLineRecord {
  productId: string;
  unitId: string;
  unitPrice: string;
  quantity: string;
  total: string;
}

export interface ProductInvoiceRecord {
  id: string;
  providerId: string;
  date: string;
  number: string | null;
  notes: string | null;
  total: string;
  lines: ProductInvoiceLineRecord[];
  latestPrices: { productId: string; price: string }[];
}

export interface InvoiceCreationRepository {
  getProvider: (id: string) => Promise<InvoiceProviderRecord | null>;
  getCatalogProducts: (
    providerId: string,
    productIds: string[]
  ) => Promise<InvoiceCatalogProduct[]>;
  insertServiceInvoice: (record: ServiceInvoiceRecord) => Promise<void>;
  insertProductInvoice: (record: ProductInvoiceRecord) => Promise<void>;
}

async function getProvider(id: string): Promise<InvoiceProviderRecord | null> {
  const [provider] = await db
    .select({ id: providers.id, type: providers.type })
    .from(providers)
    .where(eq(providers.id, id));
  return provider ?? null;
}

async function getCatalogProducts(
  providerId: string,
  productIds: string[]
): Promise<InvoiceCatalogProduct[]> {
  return db
    .select({
      productId: providerProducts.productId,
      unitId: products.unitId,
    })
    .from(providerProducts)
    .innerJoin(products, eq(providerProducts.productId, products.id))
    .where(
      and(
        eq(providerProducts.providerId, providerId),
        inArray(providerProducts.productId, productIds)
      )
    );
}

async function insertServiceInvoice(record: ServiceInvoiceRecord): Promise<void> {
  await db.insert(invoices).values({
    id: record.id,
    providerId: record.providerId,
    date: record.date,
    number: record.number,
    notes: record.notes,
    amount: record.amount,
    total: record.amount,
  });
}

async function insertProductInvoice(record: ProductInvoiceRecord): Promise<void> {
  const insertInvoice = db.insert(invoices).values({
    id: record.id,
    providerId: record.providerId,
    date: record.date,
    number: record.number,
    notes: record.notes,
    total: record.total,
  });

  const insertLines = db.insert(invoiceLines).values(
    record.lines.map((line) => ({
      invoiceId: record.id,
      productId: line.productId,
      unitId: line.unitId,
      unitPrice: line.unitPrice,
      quantity: line.quantity,
      total: line.total,
    }))
  );

  const insertHistory = db.insert(priceHistory).values(
    record.lines.map((line) => ({
      productId: line.productId,
      providerId: record.providerId,
      price: line.unitPrice,
      unitId: line.unitId,
      invoiceId: record.id,
    }))
  );

  const priceUpdates = record.latestPrices.map(({ productId, price }) =>
    db
      .update(providerProducts)
      .set({ price, updatedAt: new Date() })
      .where(
        and(
          eq(providerProducts.providerId, record.providerId),
          eq(providerProducts.productId, productId),
          notExists(
            db
              .select({ one: sql`1` })
              .from(invoices)
              .innerJoin(invoiceLines, eq(invoiceLines.invoiceId, invoices.id))
              .where(
                and(
                  eq(invoices.providerId, record.providerId),
                  eq(invoiceLines.productId, productId),
                  gt(invoices.date, record.date),
                  ne(invoices.id, record.id)
                )
              )
          )
        )
      )
  );

  await db.batch([insertInvoice, insertLines, insertHistory, ...priceUpdates]);
}

export const invoiceCreationRepository: InvoiceCreationRepository = {
  getProvider,
  getCatalogProducts,
  insertServiceInvoice,
  insertProductInvoice,
};
