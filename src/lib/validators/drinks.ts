import { z } from "zod";

import { nonNegativeDecimalSchema, requiredTextSchema, uuidSchema } from "@/lib/validation";

const amount = nonNegativeDecimalSchema(2).refine((value) => Number(value) < 10000000000);
export const drinkItemSchema = z.object({
  name: requiredTextSchema,
  unitId: uuidSchema,
  location: requiredTextSchema,
});
export const drinkTargetSchema = z.object({ itemId: uuidSchema, quantity: amount.nullable() });
export const drinkActiveSchema = z.object({ itemId: uuidSchema, active: z.boolean() });
export const drinkCountsSchema = z.array(z.object({ itemId: uuidSchema, quantity: amount, unit: requiredTextSchema })).min(1).max(200)
  .refine((rows) => new Set(rows.map((row) => row.itemId)).size === rows.length, "Hay bebidas repetidas.");
