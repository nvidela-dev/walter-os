import Decimal from "decimal.js";

export function toDecimalString(value: Decimal.Value, scale = 2): string {
  return new Decimal(value).toDecimalPlaces(scale, Decimal.ROUND_HALF_UP).toFixed(scale);
}

export function multiplyDecimalStrings(left: string, right: string, scale = 2): string {
  return toDecimalString(new Decimal(left).mul(right), scale);
}

export function sumDecimalStrings(values: string[], scale = 2): string {
  return toDecimalString(
    values.reduce((sum, value) => sum.plus(value), new Decimal(0)),
    scale
  );
}

export function isPositiveDecimal(value: string): boolean {
  try {
    return new Decimal(value).gt(0);
  } catch {
    return false;
  }
}

export function isNonNegativeDecimal(value: string): boolean {
  try {
    return new Decimal(value).gte(0);
  } catch {
    return false;
  }
}
