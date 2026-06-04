import { sql } from "drizzle-orm";
import { check, numeric, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

import { invoices } from "./invoices";
import { products } from "./products";
import { units } from "./units";

export const invoiceLines = pgTable(
  "factura_lineas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invoiceId: uuid("factura_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "restrict" }),
    productId: uuid("producto_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    unitId: uuid("unidad_id")
      .notNull()
      .references(() => units.id),
    unitPrice: numeric("precio_unit", { precision: 10, scale: 2 }).notNull(),
    quantity: numeric("cantidad", { precision: 10, scale: 2 }).notNull(),
    total: numeric("total", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    check("factura_lineas_precio_unit_positive", sql`${table.unitPrice} > 0`),
    check("factura_lineas_cantidad_positive", sql`${table.quantity} > 0`),
    check("factura_lineas_total_positive", sql`${table.total} > 0`),
  ]
);

export type InvoiceLine = typeof invoiceLines.$inferSelect;
export type NewInvoiceLine = typeof invoiceLines.$inferInsert;
