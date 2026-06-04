import { z } from "zod";

import { moneySchema, optionalTextSchema, requiredTextSchema, uuidSchema } from "@/lib/validation";

export const menuItemInputSchema = z.object({
  name: requiredTextSchema,
  description: optionalTextSchema,
  sellPrice: moneySchema,
  recipeId: z
    .string()
    .trim()
    .transform((value) => (value.length > 0 ? value : null))
    .pipe(uuidSchema.nullable()),
});

export type MenuItemInput = z.infer<typeof menuItemInputSchema>;
