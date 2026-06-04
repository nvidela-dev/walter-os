import { describe, expect, it } from "vitest";

import {
  getEmployeeDeleteBlock,
  getFacturaDeleteBlock,
  getProductDeleteBlock,
  getProviderDeleteBlock,
} from "@/lib/delete-guards";

describe("delete guard rules", () => {
  it("allows unused records", () => {
    expect(getProviderDeleteBlock({ products: 0, invoices: 0, priceHistory: 0 })).toBeNull();
    expect(getProductDeleteBlock({ invoiceLines: 0, recipes: 0, priceHistory: 0 })).toBeNull();
    expect(getFacturaDeleteBlock({ lines: 0, priceHistory: 0 })).toBeNull();
    expect(getEmployeeDeleteBlock({ extraHours: 0 })).toBeNull();
  });

  it("blocks providers with financial or catalog references", () => {
    expect(getProviderDeleteBlock({ products: 1, invoices: 0, priceHistory: 0 })).toBe(
      "No se puede eliminar este proveedor porque ya tiene productos, facturas o historial asociado."
    );
  });

  it("blocks products with invoice, recipe, or price history references", () => {
    expect(getProductDeleteBlock({ invoiceLines: 0, recipes: 1, priceHistory: 0 })).toBe(
      "No se puede eliminar este producto porque ya tiene facturas, recetas o historial asociado."
    );
  });

  it("blocks invoices and employees with historical records", () => {
    expect(getFacturaDeleteBlock({ lines: 1, priceHistory: 0 })).toBe(
      "No se puede eliminar esta factura porque tiene líneas o historial asociado."
    );
    expect(getEmployeeDeleteBlock({ extraHours: 2 })).toBe(
      "No se puede eliminar este empleado porque tiene horas extra registradas."
    );
  });
});
