import { z } from "zod";

import { nonNegativeDecimalSchema, requiredTextSchema, uuidSchema } from "@/lib/validation";

export const fridgeInputSchema = z.object({
  number: z.coerce.number().int().positive().max(2147483647),
  name: z.string().trim().max(200).transform((value) => value || null),
});
export const fridgeProductInputSchema = z.object({ fridgeId: uuidSchema, productId: uuidSchema });
export const inventoryProductInputSchema = z.object({ fridgeId: uuidSchema, name: requiredTextSchema, unitId: uuidSchema });
export const inventoryCountSchema = z.object({
  fridgeId: uuidSchema,
  counts: z.array(z.object({
    productId: uuidSchema,
    quantity: nonNegativeDecimalSchema(2).refine((value) => Number(value) < 10000000000),
  })).min(1).max(200).refine((counts) => new Set(counts.map((count) => count.productId)).size === counts.length),
});

export const inventoryEntrySchema = fridgeProductInputSchema.extend({
  note: z.string().trim().max(1000).transform((value) => value === "" ? null : value),
  quantity: nonNegativeDecimalSchema(2).refine((value) => Number(value) < 10000000000).nullable(),
});

export const fridgeDetailsSchema = z.object({
  fridgeId: uuidSchema,
  name: z.string().trim().max(200).transform((value) => value === "" ? null : value),
  commentary: z.string().trim().max(1000).transform((value) => value === "" ? null : value),
});
