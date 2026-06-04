import { sql } from "drizzle-orm";
import { boolean, check, date, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { providers } from "./providers";

export const invoices = pgTable(
  "facturas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    providerId: uuid("proveedor_id")
      .notNull()
      .references(() => providers.id, { onDelete: "restrict" }),
    date: date("fecha").notNull(),
    number: text("numero"),
    // Set on service-type invoices: a single fixed amount instead of line items.
    // Mutually exclusive with factura_lineas — enforced in the createInvoice
    // server action; not as a DB constraint since it spans two tables.
    amount: numeric("monto", { precision: 12, scale: 2 }),
    total: numeric("total", { precision: 12, scale: 2 }).notNull(),
    paid: boolean("paid").notNull().default(false),
    notes: text("notas"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    check("facturas_total_positive", sql`${table.total} > 0`),
    check("facturas_monto_positive", sql`${table.amount} IS NULL OR ${table.amount} > 0`),
  ]
);

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
