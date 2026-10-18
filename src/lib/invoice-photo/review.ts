import Decimal from "decimal.js";

export function invoiceDraftTotal(value: string | { quantity: string; unitPrice: string }[]): string | null {
  try {
    const total = typeof value === "string" ? new Decimal(value) : value.reduce((sum, line) => sum.plus(new Decimal(line.quantity).times(line.unitPrice).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)), new Decimal(0));
    return total.isFinite() ? total.toFixed(2) : null;
  } catch { return null; }
}

export function reviewedTotalMatches(value: string | { quantity: string; unitPrice: string }[], total: string): boolean {
  if (!/^\d+(\.\d{1,2})?$/.test(total)) return false;
  try {
    const expected = new Decimal(total);
    const actual = invoiceDraftTotal(value);
    return actual !== null && expected.greaterThan(0) && new Decimal(actual).equals(expected);
  } catch { return false; }
}
