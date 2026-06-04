import { describe, expect, it } from "vitest";
import {
  isNonNegativeDecimal,
  isPositiveDecimal,
  multiplyDecimalStrings,
  sumDecimalStrings,
  toDecimalString,
} from "@/lib/money";

describe("decimal money helpers", () => {
  it("rounds using explicit two-decimal half-up behavior", () => {
    expect(toDecimalString("1.235")).toBe("1.24");
    expect(toDecimalString("1.234")).toBe("1.23");
  });

  it("multiplies and sums without floating point drift", () => {
    expect(multiplyDecimalStrings("0.10", "0.20")).toBe("0.02");
    expect(sumDecimalStrings(["0.10", "0.20", "0.30"])).toBe("0.60");
  });

  it("checks positive and nonnegative decimals", () => {
    expect(isPositiveDecimal("0.01")).toBe(true);
    expect(isPositiveDecimal("0")).toBe(false);
    expect(isNonNegativeDecimal("0")).toBe(true);
    expect(isNonNegativeDecimal("-0.01")).toBe(false);
  });
});
