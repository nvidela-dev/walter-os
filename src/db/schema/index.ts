// Core entities - Spanish table names as per project requirements

// Units of measure
export * from "./unidades";

// Products
export * from "./productos";

// Providers
export * from "./proveedores";

// Provider-Product relationship (N:N with prices)
export * from "./proveedor-productos";

// Employees
export * from "./empleados";

// Extra hours tracking
export * from "./horas-extra";

// Recipes
export * from "./recetas";

// Recipe ingredients (N:N with products)
export * from "./receta-productos";

// Menu items
export * from "./menu";

// Invoices (header)
export * from "./facturas";

// Invoice line items (snapshot of price/unit at time of invoice)
export * from "./factura-lineas";

// Append-only price change log (single source of truth for price evolution)
export * from "./historial-precios";
