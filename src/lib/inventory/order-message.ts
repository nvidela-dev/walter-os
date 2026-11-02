import type { SupplierPurchaseGroup } from "./purchases";

export function orderMessage(group: SupplierPurchaseGroup): string {
  return group.products.map(product => `• ${product.name}: ${product.comparison.shortage ?? ""} ${product.unit}`).join("\n");
}
