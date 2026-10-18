import { sql } from "drizzle-orm";
import { check, date, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// One rolling counter per actor plus one global counter; no images or extracted text.
export const invoiceScanUsage = pgTable("uso_lectura_facturas", {
  key: text("clave").primaryKey(),
  day: date("dia").notNull(),
  count: integer("cantidad").notNull(),
  lastAt: timestamp("ultimo_at", { withTimezone: true }).notNull(),
}, (table) => [check("uso_lectura_facturas_cantidad", sql`${table.count} > 0`)]);
