import type { ProviderType } from "./providers";

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
