import { describe, expect, it } from "vitest";

import {
  moneySchema,
  nonNegativeMoneySchema,
  optionalTextSchema,
  parseUuidOrNull,
  providerDaysSchema,
  quantitySchema,
  requiredTextSchema,
  uuidSchema,
} from "@/lib/validation";

describe("validation primitives", () => {
  it("normalizes required and optional text", () => {
    expect(requiredTextSchema.parse("  Proveedor  ")).toBe("Proveedor");
    expect(optionalTextSchema.parse("")).toBeNull();
    expect(optionalTextSchema.parse("  notas  ")).toBe("notas");
  });

  it("validates UUID values", () => {
    const id = "5ac23a65-cc36-410d-a92d-5c84944d638c";
    expect(uuidSchema.safeParse(id).success).toBe(true);
    expect(uuidSchema.safeParse("nope").success).toBe(false);
    expect(parseUuidOrNull(id)).toBe(id);
    expect(parseUuidOrNull("nope")).toBeNull();
  });

  it("normalizes money and quantity decimals", () => {
    expect(moneySchema.parse("12")).toBe("12.00");
    expect(moneySchema.parse("12.3")).toBe("12.30");
    expect(quantitySchema.parse("1.234")).toBe("1.234");
  });

  it("rejects invalid financial values", () => {
    expect(moneySchema.safeParse("0").success).toBe(false);
    expect(moneySchema.safeParse("12.345").success).toBe(false);
    expect(nonNegativeMoneySchema.parse("0")).toBe("0.00");
    expect(nonNegativeMoneySchema.safeParse("-1").success).toBe(false);
  });

  it("accepts only configured provider visit days", () => {
    expect(providerDaysSchema.parse("L,M,V")).toBe("L,M,V");
    expect(providerDaysSchema.parse("")).toBeNull();
    expect(providerDaysSchema.safeParse("L,Q").success).toBe(false);
  });
});
