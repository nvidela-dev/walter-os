import { describe, expect, it } from "vitest";

import { compareStockToTarget, groupInventoryPurchases, type PurchaseProduct } from "@/lib/inventory/purchases";

const counts = [{ quantity: "3.25", unit: "kg" }, { quantity: "4.50", unit: "kg" }];
const supplierA = { id: "a", name: "Proveedor A" };
const supplierB = { id: "b", name: "Proveedor B" };
function product(id: string, shortage: string | null, suppliers = [supplierA]): PurchaseProduct {
  return { id, name: id, unit: "kg", suppliers, comparison: { stock: "8", target: "12", shortage, issues: shortage === null ? ["missing-count"] : [] } };
}

describe("global target shortages", () => {
  it("sums all fridge counts exactly, clips excess to zero, and accepts explicit zero", () => {
    expect(compareStockToTarget("kg", counts, { quantity: "12.00", unit: "kg" })).toEqual({ stock: "7.75", target: "12.00", shortage: "4.25", issues: [] });
    expect(compareStockToTarget("kg", counts, { quantity: "5", unit: "kg" }).shortage).toBe("0");
    expect(compareStockToTarget("kg", [{ quantity: "0", unit: "kg" }], { quantity: "4", unit: "kg" }).shortage).toBe("4");
    expect(compareStockToTarget("kg", counts, { quantity: "0", unit: "kg" }).shortage).toBe("0");
    expect(compareStockToTarget("kg", [{ quantity: "0.1", unit: "kg" }, { quantity: "0.2", unit: "kg" }], { quantity: "0.4", unit: "kg" }).shortage).toBe("0.1");
  });
  it("refuses partial totals, absent targets, and implicit unit conversions", () => {
    expect(compareStockToTarget("kg", [...counts, null], { quantity: "12", unit: "kg" })).toMatchObject({ stock: null, shortage: null, issues: ["missing-count"] });
    expect(compareStockToTarget("kg", counts, null)).toMatchObject({ stock: "7.75", shortage: null, issues: ["missing-target"] });
    expect(compareStockToTarget("kg", counts, { quantity: "12", unit: "unidad" })).toMatchObject({ shortage: null, issues: ["unit-mismatch"] });
    expect(compareStockToTarget("kg", [{ quantity: "8", unit: "unidad" }], { quantity: "12", unit: "kg" }).shortage).toBeNull();
    expect(compareStockToTarget("kg", [], null).issues).toEqual(["missing-count", "missing-target"]);
    expect(compareStockToTarget("kg", [null], { quantity: "0", unit: "kg" }).shortage).toBeNull();
  });
});

describe("supplier grouping", () => {
  it("automatically uses a sole supplier but never duplicates purchases across multiple suppliers", () => {
    const products = [product("rice", "4"), product("salt", "2", [supplierA, supplierB]), product("missingSupplier", "1", []), product("unknownStock", null), product("enough", "0", [])];
    const initial = groupInventoryPurchases(products, {});
    expect(initial.groups.map((group) => [group.supplier.id, group.products.map((row) => row.id)])).toEqual([["a", ["rice"]]]);
    expect(initial.unresolved.map((row) => row.id)).toEqual(["salt", "missingSupplier", "unknownStock"]);
    expect(initial.noPurchase.map((row) => row.id)).toEqual(["enough"]);
    const chosen = groupInventoryPurchases(products, { salt: "b" });
    expect(chosen.groups.map((group) => [group.supplier.id, group.products.map((row) => row.id)])).toEqual([["a", ["rice"]], ["b", ["salt"]]]);
    const changed = groupInventoryPurchases(products, { salt: "a" });
    expect(changed.groups).toHaveLength(1);
    expect(changed.groups[0]?.products.map((row) => row.id)).toEqual(["rice", "salt"]);
    expect(groupInventoryPurchases(products, { salt: "not-linked" }).unresolved.map((row) => row.id)).toContain("salt");
  });
});
