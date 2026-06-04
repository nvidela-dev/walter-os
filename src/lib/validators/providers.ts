import { z } from "zod";

import {
  moneySchema,
  nonNegativeMoneySchema,
  optionalTextSchema,
  providerDaysSchema,
  quantitySchema,
  requiredTextSchema,
  uuidSchema,
} from "@/lib/validation";

export const providerInputSchema = z.object({
  name: requiredTextSchema,
  description: optionalTextSchema,
  type: z.enum(["producto", "servicio"]),
  days: providerDaysSchema,
});

export const providerDebtInputSchema = z.object({
  debt: nonNegativeMoneySchema,
});

export const createProductForProviderInputSchema = z.object({
  providerId: uuidSchema,
  productData: z.object({
    name: requiredTextSchema,
    description: optionalTextSchema,
    unitId: uuidSchema,
  }),
  price: moneySchema,
  quantity: quantitySchema,
});

export const updateProductInputSchema = z.object({
  providerId: uuidSchema,
  productId: uuidSchema,
  data: z.object({
    name: requiredTextSchema,
    unitId: uuidSchema,
    price: moneySchema,
  }),
});

export const productProviderInputSchema = z.object({
  providerId: uuidSchema,
  productId: uuidSchema,
});

export const updateProductPriceInputSchema = productProviderInputSchema.extend({
  price: moneySchema,
});

export type ProviderInput = z.infer<typeof providerInputSchema>;
export type ProviderDebtInput = z.infer<typeof providerDebtInputSchema>;
export type CreateProductForProviderInput = z.infer<typeof createProductForProviderInputSchema>;
export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;
