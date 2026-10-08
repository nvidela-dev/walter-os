import Decimal from "decimal.js";

export type PurchaseIssue = "missing-count" | "missing-target" | "unit-mismatch";
export interface PurchaseComparison {
  stock: string | null; target: string | null; shortage: string | null; issues: PurchaseIssue[];
}

/** Never substitute missing counts or targets with zero, or convert unrelated units. */
export function compareStockToTarget(unit: string, counts: ({ quantity: string; unit: string } | null)[], target: { quantity: string; unit: string } | null): PurchaseComparison {
  const issues: PurchaseIssue[] = [];
  if (counts.length === 0 || counts.some((count) => count === null)) issues.push("missing-count");
  if (target === null) issues.push("missing-target");
  if (counts.some((count) => count !== null && count.unit !== unit) || (target !== null && target.unit !== unit)) issues.push("unit-mismatch");
  const stock = issues.includes("missing-count") || issues.includes("unit-mismatch") ? null : counts.reduce((sum, count) => sum.plus(count?.quantity ?? "0"), new Decimal(0)).toString();
  const targetQuantity = target?.quantity ?? null;
  return { stock, target: targetQuantity, shortage: issues.length > 0 || stock === null || targetQuantity === null ? null : Decimal.max(new Decimal(targetQuantity).minus(stock), 0).toString(), issues };
}

export interface PurchaseSupplier { id: string; name: string }
export interface PurchaseProduct {
  id: string; name: string; unit: string; comparison: PurchaseComparison; suppliers: PurchaseSupplier[];
}
export interface SupplierPurchaseGroup { supplier: PurchaseSupplier; products: PurchaseProduct[] }
export interface GroupedPurchases {
  groups: SupplierPurchaseGroup[]; unresolved: PurchaseProduct[]; noPurchase: PurchaseProduct[];
}

export function selectedPurchaseSupplier(product: PurchaseProduct, choices: Record<string, string>): PurchaseSupplier | null {
  const chosen = product.suppliers.find((supplier) => supplier.id === choices[product.id]);
  if (chosen !== undefined) return chosen;
  return product.suppliers.length === 1 ? product.suppliers[0] ?? null : null;
}

export function groupInventoryPurchases(products: PurchaseProduct[], choices: Record<string, string>): GroupedPurchases {
  const groups = new Map<string, SupplierPurchaseGroup>();
  const unresolved: PurchaseProduct[] = [];
  const noPurchase: PurchaseProduct[] = [];
  for (const product of products) {
    if (product.comparison.shortage === null) { unresolved.push(product); continue; }
    if (new Decimal(product.comparison.shortage).isZero()) { noPurchase.push(product); continue; }
    const supplier = selectedPurchaseSupplier(product, choices);
    if (supplier === null) { unresolved.push(product); continue; }
    const group = groups.get(supplier.id) ?? { supplier, products: [] };
    group.products.push(product);
    groups.set(supplier.id, group);
  }
  return { groups: [...groups.values()].sort((a, b) => a.supplier.name.localeCompare(b.supplier.name)), unresolved, noPurchase };
}
