// Core entities - Spanish table names as per project requirements

// Products
export * from "./productos";

// Providers
export * from "./proveedores";

// Provider-Product relationship (N:N with prices)
export * from "./proveedor-productos";

// Services (utilities, bills)
export * from "./servicios";

// Service payments
export * from "./pagos-servicios";

// House expenses
export * from "./gastos-hogar";

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
