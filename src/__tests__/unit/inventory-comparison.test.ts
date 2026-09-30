import { describe, expect, it } from "vitest";

import { inventoryDifference } from "@/lib/inventory/comparison";
import manifest from "@/lib/inventory/manifest";

const snapshot = (quantity: string, unit = "unidad") => ({ quantity, unit, recordedAt: "2026-09-30T12:00:00Z" });

describe("inventory comparisons", () => {
  it("computes change, including fractional quantities, without calling it consumption", () => {
    expect(inventoryDifference(snapshot("12"), snapshot("17"))).toBe("-5");
    expect(inventoryDifference(snapshot("0.3"), snapshot("0.1"))).toBe("0.2");
    expect(inventoryDifference(snapshot("8"), snapshot("8"))).toBe("0");
  });
  it("does not fabricate zero baselines or compare incompatible units", () => {
    expect(inventoryDifference(snapshot("12"), null)).toBeNull();
    expect(inventoryDifference(null, null)).toBeNull();
    expect(inventoryDifference(snapshot("12", "kg"), snapshot("17"))).toBeNull();
  });
  it("provides a distinct standalone inventory manifest", () => {
    expect(manifest()).toMatchObject({ id: "/inventory", start_url: "/inventory", scope: "/inventory", display: "standalone" });
    expect(manifest().icons?.map((icon) => icon.sizes)).toContain("512x512");
  });
});
