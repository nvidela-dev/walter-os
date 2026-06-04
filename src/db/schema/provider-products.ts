import { relations, sql } from "drizzle-orm";
import { check, numeric, pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";

import { products } from "./products";
import { providers } from "./providers";

export const providerProducts = pgTable(
  "proveedor_productos",
  {
    providerId: uuid("proveedor_id")
      .notNull()
      .references(() => providers.id, { onDelete: "restrict" }),
    productId: uuid("producto_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    price: numeric("precio", { precision: 10, scale: 2 }).notNull(),
    quantity: numeric("cantidad", { precision: 10, scale: 2 }).notNull().default("1"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.providerId, table.productId] }),
    check("proveedor_productos_precio_positive", sql`${table.price} > 0`),
    check("proveedor_productos_cantidad_positive", sql`${table.quantity} > 0`),
  ]
);

// Relations
export const providersRelations = relations(providers, ({ many }) => ({
  products: many(providerProducts),
}));

export const productsRelations = relations(products, ({ many }) => ({
  providers: many(providerProducts),
}));

export const providerProductsRelations = relations(
  providerProducts,
  ({ one }) => ({
    provider: one(providers, {
      fields: [providerProducts.providerId],
      references: [providers.id],
    }),
    product: one(products, {
      fields: [providerProducts.productId],
      references: [products.id],
    }),
  })
);

export type ProviderProduct = typeof providerProducts.$inferSelect;
export type NewProviderProduct = typeof providerProducts.$inferInsert;
