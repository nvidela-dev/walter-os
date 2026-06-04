import { z } from "zod";

import { t } from "@/i18n";

import { isNonNegativeDecimal, isPositiveDecimal, toDecimalString } from "./money";

const decimalPattern = (scale: number): RegExp => new RegExp(`^\\d+(\\.\\d{1,${scale}})?$`);

export const uuidSchema = z.uuid(t.validation.invalidId);

export const requiredTextSchema = z
  .string()
  .trim()
  .min(1, t.validation.requiredField)
  .max(200, t.validation.textTooLong);

export const optionalTextSchema = z
  .string()
  .trim()
  .max(1_000, t.validation.textTooLong)
  .transform((value) => (value.length > 0 ? value : null))
  .nullable()
  .optional()
  .transform((value) => value ?? null);

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, t.validation.invalidDate);

export function positiveDecimalSchema(scale = 2): z.ZodType<string> {
  return z
    .string()
    .trim()
    .regex(decimalPattern(scale), t.validation.decimalScale(scale))
    .refine(isPositiveDecimal, t.validation.mustBePositive)
    .transform((value) => toDecimalString(value, scale));
}

export function nonNegativeDecimalSchema(scale = 2): z.ZodType<string> {
  return z
    .string()
    .trim()
    .regex(decimalPattern(scale), t.validation.decimalScale(scale))
    .refine(isNonNegativeDecimal, t.validation.mustBeNonNegative)
    .transform((value) => toDecimalString(value, scale));
}

export const moneySchema = positiveDecimalSchema(2);
export const nonNegativeMoneySchema = nonNegativeDecimalSchema(2);
export const quantitySchema = positiveDecimalSchema(3);

export const providerTypeSchema = z.enum(["producto", "servicio"]);

export const providerDaysSchema = z
  .string()
  .nullable()
  .optional()
  .transform((value) => value ?? "")
  .refine(
    (value) =>
      value === "" ||
      value.split(",").every((day) => ["L", "M", "X", "J", "V", "S", "D"].includes(day)),
    t.validation.invalidVisitDay
  )
  .transform((value) => (value.length > 0 ? value : null));
