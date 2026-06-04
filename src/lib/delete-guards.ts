import { t } from "@/i18n";

export interface ProviderDeleteReferences {
  products: number;
  invoices: number;
  priceHistory: number;
}

export interface ProductDeleteReferences {
  invoiceLines: number;
  recipes: number;
  priceHistory: number;
}

export interface InvoiceDeleteReferences {
  lines: number;
  priceHistory: number;
}

export interface EmployeeDeleteReferences {
  extraHours: number;
}

function hasReferences(counts: number[]): boolean {
  return counts.some((count) => count > 0);
}

export function getProviderDeleteBlock(references: ProviderDeleteReferences): string | null {
  return hasReferences([references.products, references.invoices, references.priceHistory])
    ? t.errors.provider.deleteBlocked
    : null;
}

export function getProductDeleteBlock(references: ProductDeleteReferences): string | null {
  return hasReferences([references.invoiceLines, references.recipes, references.priceHistory])
    ? t.errors.product.deleteBlocked
    : null;
}

export function getInvoiceDeleteBlock(references: InvoiceDeleteReferences): string | null {
  return hasReferences([references.lines, references.priceHistory])
    ? t.errors.invoice.deleteBlocked
    : null;
}

export function getEmployeeDeleteBlock(references: EmployeeDeleteReferences): string | null {
  return references.extraHours > 0 ? t.errors.employee.deleteBlocked : null;
}
