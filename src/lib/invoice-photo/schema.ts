import { z } from "zod";

const text = z.string().max(500).nullable();
const decimal = z.string().regex(/^\d{1,10}(\.\d{1,3})?$/).nullable();
export const extractedInvoiceSchema = z.object({
  supplier: text,
  date: z.iso.date().nullable(),
  number: text,
  currency: text,
  total: decimal,
  tax: decimal,
  discount: decimal,
  adjustments: text,
  warnings: z.array(z.string().max(500)).max(20),
  lines: z.array(z.object({
    description: text,
    quantity: decimal,
    unit: text,
    unitPrice: decimal,
    total: decimal,
  })).max(100),
});
export type ExtractedInvoice = z.infer<typeof extractedInvoiceSchema>;
export const MAX_PHOTO_BYTES = 3 * 1024 * 1024;

export function exactNameMatch<T extends { name: string }>(name: string | null, options: T[]): T | undefined {
  if (name === null || name.trim() === "") return undefined;
  const normalize = (value: string): string => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/\s+/g, " ");
  const matches = options.filter((option) => normalize(option.name) === normalize(name));
  return matches.length === 1 ? matches[0] : undefined;
}
