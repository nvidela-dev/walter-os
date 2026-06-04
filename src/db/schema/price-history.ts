import { sql } from "drizzle-orm";
import { check, numeric, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

import { invoices } from "./invoices";
import { products } from "./products";
import { providers } from "./providers";
import { units } from "./units";

export const priceHistory = pgTable(
  "historial_precios",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("producto_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    providerId: uuid("proveedor_id")
      .notNull()
      .references(() => providers.id, { onDelete: "restrict" }),
    price: numeric("precio", { precision: 10, scale: 2 }).notNull(),
    unitId: uuid("unidad_id")
      .notNull()
      .references(() => units.id),
    invoiceId: uuid("factura_id").references(() => invoices.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [check("historial_precios_precio_positive", sql`${table.price} > 0`)]
);

export type PriceHistory = typeof priceHistory.$inferSelect;
export type NewPriceHistory = typeof priceHistory.$inferInsert;
