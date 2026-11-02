import { z } from "zod";

import { moneySchema, optionalTextSchema, requiredTextSchema, uuidSchema } from "@/lib/validation";

export const menuItemInputSchema = z.object({
  name: requiredTextSchema,
  description: optionalTextSchema,
  sellPrice: moneySchema.nullable(),
  sectionId: uuidSchema.nullable().optional().default(null),
  priceOptions: z.array(z.object({ label: requiredTextSchema, price: moneySchema.nullable() })).max(30).default([]),
  reviewNote: optionalTextSchema,
  sortOrder: z.number().int().min(0).max(10000).default(0),
  recipeId: z
    .string()
    .nullable()
    .optional()
    .transform((value) => value == null || value.trim() === "" ? null : value.trim())
    .pipe(uuidSchema.nullable()),
});

export type MenuItemInput = z.infer<typeof menuItemInputSchema>;

export const menuSectionSchema = z.object({
  menuName: requiredTextSchema, name: requiredTextSchema,
  sortOrder: z.number().int().min(0).max(10000),
});
