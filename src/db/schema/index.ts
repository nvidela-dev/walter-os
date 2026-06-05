// Core entities. Code is English; physical table/column names stay Spanish
// (see docs/i18n.md).

// Units of measure
export * from "./units";

// Products
export * from "./products";

// Providers
export * from "./providers";

// Provider-Product relationship (N:N with prices)
export * from "./provider-products";

// Employees
export * from "./employees";

// Extra hours tracking
export * from "./extra-hours";

// Recipes
export * from "./recipes";

// Recipe ingredients (N:N with products)
export * from "./recipe-products";

// Menu items
export * from "./menu";

// Invoices (header)
export * from "./invoices";

// Invoice line items (snapshot of price/unit at time of invoice)
export * from "./invoice-lines";

// Append-only price change log (single source of truth for price evolution)
export * from "./price-history";

// Access-control allowlist (the only authorization policy)
export * from "./allowed-emails";
