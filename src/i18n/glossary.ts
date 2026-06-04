// ─────────────────────────────────────────────────────────────────────────────
// ENTITY GLOSSARY — single source of truth for naming.
//
// The codebase is written entirely in English (variables, types, props, routes).
// The UI is rendered entirely in Spanish. The database keeps Spanish physical
// identifiers (table + column names) — those are intentionally NOT translated.
//
// This file is the Rosetta stone tying the three together:
//   - `key`      → the English domain concept used throughout the code
//   - singular   → Spanish display term (one)
//   - plural     → Spanish display term (many)
//   - table      → the physical Postgres table name (Spanish — do NOT rename)
//
// When you add an entity, add it here first.
// ─────────────────────────────────────────────────────────────────────────────

export const glossary = {
  unit: { singular: "Unidad", plural: "Unidades", table: "unidades" },
  product: { singular: "Producto", plural: "Productos", table: "productos" },
  provider: { singular: "Proveedor", plural: "Proveedores", table: "proveedores" },
  providerProduct: { singular: "Producto de proveedor", plural: "Productos de proveedor", table: "proveedor_productos" },
  employee: { singular: "Empleado", plural: "Equipo", table: "empleados" },
  extraHour: { singular: "Hora extra", plural: "Horas extra", table: "horas_extra" },
  recipe: { singular: "Receta", plural: "Recetas", table: "recetas" },
  recipeProduct: { singular: "Ingrediente", plural: "Ingredientes", table: "receta_productos" },
  menuItem: { singular: "Plato", plural: "Menú", table: "menu" },
  invoice: { singular: "Factura", plural: "Facturas", table: "facturas" },
  invoiceLine: { singular: "Línea", plural: "Líneas", table: "factura_lineas" },
  priceHistory: { singular: "Historial de precios", plural: "Historial de precios", table: "historial_precios" },
} as const;

export type EntityKey = keyof typeof glossary;
