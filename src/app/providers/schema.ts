import { z } from "zod";

import {
  moneySchema,
  nonNegativeMoneySchema,
  optionalTextSchema,
  proveedorTipoSchema,
  providerDaysSchema,
  quantitySchema,
  requiredTextSchema,
  uuidSchema,
} from "@/lib/validation";

export const providerInputSchema = z.object({
  nombre: requiredTextSchema,
  descripcion: optionalTextSchema,
  tipo: proveedorTipoSchema,
  dias: providerDaysSchema,
});
export type ProviderFormValues = z.input<typeof providerInputSchema>;

export const debtInputSchema = z.object({
  deuda: nonNegativeMoneySchema,
});
export type DebtFormValues = z.input<typeof debtInputSchema>;

export const addProductFormSchema = z.object({
  nombre: requiredTextSchema,
  descripcion: optionalTextSchema,
  unidadId: uuidSchema,
  precio: moneySchema,
  cantidad: quantitySchema,
});
export type AddProductFormValues = z.input<typeof addProductFormSchema>;

export const productEditFormSchema = z.object({
  nombre: requiredTextSchema,
  unidadId: uuidSchema,
  precio: moneySchema,
});
export type ProductEditFormValues = z.input<typeof productEditFormSchema>;
