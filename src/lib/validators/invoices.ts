import { z } from "zod";

import { t } from "@/i18n";
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

export const invoiceProductSchema = invoiceBaseSchema.extend({
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

export const invoiceServiceSchema = invoiceBaseSchema.extend({
  amount: moneySchema,
  lines: z.never().optional(),
});

export const createInvoiceSchema = z.union([invoiceProductSchema, invoiceServiceSchema]);

export type CreateInvoiceInput = z.input<typeof createInvoiceSchema>;
export type ValidatedCreateInvoiceInput = z.output<typeof createInvoiceSchema>;
