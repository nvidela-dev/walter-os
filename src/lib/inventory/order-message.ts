import type { SupplierPurchaseGroup } from "./purchases";

export function orderMessage(group: SupplierPurchaseGroup, report: string, date: string): string {
  return [
    `Hola ${group.supplier.name}, necesitamos este pedido de ${report}:`,
    ...group.products.map(product => `• ${product.name}: ${product.comparison.shortage ?? ""} ${product.unit}`),
    "",
    `Inventario de referencia: ${date}.`,
    "¿Nos confirman disponibilidad y entrega? Gracias.",
  ].join("\n");
}
