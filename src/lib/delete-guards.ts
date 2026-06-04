export interface ProviderDeleteReferences {
  products: number;
  invoices: number;
  priceHistory: number;
}

export interface ProductDeleteReferences {
  invoiceLines: number;
  recipes: number;
  priceHistory: number;
}

export interface FacturaDeleteReferences {
  lines: number;
  priceHistory: number;
}

export interface EmployeeDeleteReferences {
  extraHours: number;
}

function hasReferences(counts: number[]) {
  return counts.some((count) => count > 0);
}

export function getProviderDeleteBlock(references: ProviderDeleteReferences) {
  return hasReferences([references.products, references.invoices, references.priceHistory])
    ? "No se puede eliminar este proveedor porque ya tiene productos, facturas o historial asociado."
    : null;
}

export function getProductDeleteBlock(references: ProductDeleteReferences) {
  return hasReferences([references.invoiceLines, references.recipes, references.priceHistory])
    ? "No se puede eliminar este producto porque ya tiene facturas, recetas o historial asociado."
    : null;
}

export function getFacturaDeleteBlock(references: FacturaDeleteReferences) {
  return hasReferences([references.lines, references.priceHistory])
    ? "No se puede eliminar esta factura porque tiene líneas o historial asociado."
    : null;
}

export function getEmployeeDeleteBlock(references: EmployeeDeleteReferences) {
  return references.extraHours > 0
    ? "No se puede eliminar este empleado porque tiene horas extra registradas."
    : null;
}
