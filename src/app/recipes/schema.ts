import { z } from "zod";

import { optionalTextSchema, requiredTextSchema } from "@/lib/validation";

export const recipeInputSchema = z.object({
  nombre: requiredTextSchema,
  descripcion: optionalTextSchema,
});

export type RecipeFormValues = z.input<typeof recipeInputSchema>;
