import "server-only";

import { asc, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  invoiceLines,
  invoices,
  products,
  providerProducts,
  providers,
  type ProviderType,
  units,
} from "@/db/schema";

export interface TreeProduct {
  productId: string;
  name: string;
  unit: string;
  price: string;
}

export interface TreeInvoiceLine {
  id: string;
  productId: string;
  productName: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  total: string;
}

export interface TreeInvoice {
  id: string;
  number: string | null;
  date: string;
  total: string;
  paid: boolean;
  lines: TreeInvoiceLine[];
}

export interface ProviderNode {
  id: string;
  name: string;
  type: ProviderType;
  debt: string;
  products: TreeProduct[];
  invoices: TreeInvoice[];
}

/**
 * Assembles the full provider → {products, invoices → lines} tree in four bulk
 * queries (no N+1), then stitches the relations together in memory.
 */
export async function getProviderTree(): Promise<ProviderNode[]> {
  const [providerRows, productRows, invoiceRows, lineRows] = await Promise.all([
    db
      .select({
        id: providers.id,
        name: providers.name,
        type: providers.type,
        debt: providers.debt,
      })
      .from(providers)
      .orderBy(asc(providers.name)),
    db
      .select({
        providerId: providerProducts.providerId,
        productId: providerProducts.productId,
        name: products.name,
        unit: units.code,
        price: providerProducts.price,
      })
      .from(providerProducts)
      .innerJoin(products, eq(providerProducts.productId, products.id))
      .innerJoin(units, eq(products.unitId, units.id))
      .orderBy(asc(products.name)),
    db
      .select({
        id: invoices.id,
        providerId: invoices.providerId,
        number: invoices.number,
        date: invoices.date,
        total: invoices.total,
        paid: invoices.paid,
      })
      .from(invoices)
      .orderBy(desc(invoices.date), desc(invoices.createdAt)),
    db
      .select({
        id: invoiceLines.id,
        invoiceId: invoiceLines.invoiceId,
        productId: invoiceLines.productId,
        productName: products.name,
        unit: units.code,
        quantity: invoiceLines.quantity,
        unitPrice: invoiceLines.unitPrice,
        total: invoiceLines.total,
      })
      .from(invoiceLines)
      .innerJoin(products, eq(invoiceLines.productId, products.id))
      .innerJoin(units, eq(invoiceLines.unitId, units.id))
      .orderBy(asc(invoiceLines.createdAt)),
  ]);

  const linesByInvoice = new Map<string, TreeInvoiceLine[]>();
  for (const line of lineRows) {
    const list = linesByInvoice.get(line.invoiceId) ?? [];
    list.push({
      id: line.id,
      productId: line.productId,
      productName: line.productName,
      unit: line.unit,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      total: line.total,
    });
    linesByInvoice.set(line.invoiceId, list);
  }

  const invoicesByProvider = new Map<string, TreeInvoice[]>();
  for (const invoice of invoiceRows) {
    const list = invoicesByProvider.get(invoice.providerId) ?? [];
    list.push({
      id: invoice.id,
      number: invoice.number,
      date: invoice.date,
      total: invoice.total,
      paid: invoice.paid,
      lines: linesByInvoice.get(invoice.id) ?? [],
    });
    invoicesByProvider.set(invoice.providerId, list);
  }

  const productsByProvider = new Map<string, TreeProduct[]>();
  for (const product of productRows) {
    const list = productsByProvider.get(product.providerId) ?? [];
    list.push({
      productId: product.productId,
      name: product.name,
      unit: product.unit,
      price: product.price,
    });
    productsByProvider.set(product.providerId, list);
  }

  return providerRows.map((provider) => ({
    id: provider.id,
    name: provider.name,
    type: provider.type,
    debt: provider.debt,
    products: productsByProvider.get(provider.id) ?? [],
    invoices: invoicesByProvider.get(provider.id) ?? [],
  }));
}
