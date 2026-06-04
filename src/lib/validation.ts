import { z } from "zod";
import { isNonNegativeDecimal, isPositiveDecimal, toDecimalString } from "./money";

const decimalPattern = (scale: number) => new RegExp(`^\\d+(\\.\\d{1,${scale}})?$`);

export const uuidSchema = z.string().uuid("Identificador inválido.");

export const requiredTextSchema = z
  .string()
  .trim()
  .min(1, "Este campo es obligatorio.")
  .max(200, "El texto es demasiado largo.");

export const optionalTextSchema = z
  .string()
  .trim()
  .max(1_000, "El texto es demasiado largo.")
  .transform((value) => (value.length > 0 ? value : null))
  .nullable()
  .optional()
  .transform((value) => value ?? null);

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato AAAA-MM-DD.");

export function positiveDecimalSchema(scale = 2) {
  return z
    .string()
    .trim()
    .regex(decimalPattern(scale), `Usá hasta ${scale} decimales.`)
    .refine(isPositiveDecimal, "El valor debe ser mayor que cero.")
    .transform((value) => toDecimalString(value, scale));
}

export function nonNegativeDecimalSchema(scale = 2) {
  return z
    .string()
    .trim()
    .regex(decimalPattern(scale), `Usá hasta ${scale} decimales.`)
    .refine(isNonNegativeDecimal, "El valor no puede ser negativo.")
    .transform((value) => toDecimalString(value, scale));
}

export const moneySchema = positiveDecimalSchema(2);
export const nonNegativeMoneySchema = nonNegativeDecimalSchema(2);
export const quantitySchema = positiveDecimalSchema(3);

export const proveedorTipoSchema = z.enum(["producto", "servicio"]);

export const providerDaysSchema = z
  .string()
  .nullable()
  .optional()
  .transform((value) => value ?? "")
  .refine(
    (value) =>
      value === "" ||
      value.split(",").every((day) => ["L", "M", "X", "J", "V", "S", "D"].includes(day)),
    "Día de visita inválido."
  )
  .transform((value) => (value.length > 0 ? value : null));
