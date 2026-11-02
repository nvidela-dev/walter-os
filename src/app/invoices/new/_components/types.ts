import type { ExtractedInvoice } from "@/lib/invoice-photo/schema";

export interface InvoiceLineDraft {
  source?: ExtractedInvoice["lines"][number];
  productId: string;
  quantity: string;
  unitPrice: string;
}

export const NEW_PRODUCT_VALUE = "__new__";
