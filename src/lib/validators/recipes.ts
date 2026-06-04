import { z } from "zod";

import { optionalTextSchema, requiredTextSchema } from "@/lib/validation";

export const recipeInputSchema = z.object({
  name: requiredTextSchema,
  description: optionalTextSchema,
});

export type RecipeInput = z.infer<typeof recipeInputSchema>;
