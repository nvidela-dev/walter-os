import { z } from "zod";

import { moneySchema, optionalTextSchema, requiredTextSchema, uuidSchema } from "@/lib/validation";

export const menuItemInputSchema = z.object({
  nombre: requiredTextSchema,
  descripcion: optionalTextSchema,
  precioVenta: moneySchema,
  recetaId: z
    .string()
    .trim()
    .transform((value) => (value.length > 0 ? value : null))
    .pipe(uuidSchema.nullable()),
});

export type MenuFormValues = z.input<typeof menuItemInputSchema>;
