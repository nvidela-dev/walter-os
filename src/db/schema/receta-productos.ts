import { relations, sql } from "drizzle-orm";
import { check, numeric, pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";

import { productos } from "./productos";
import { recetas } from "./recetas";

export const recetaProductos = pgTable(
  "receta_productos",
  {
    recetaId: uuid("receta_id")
      .notNull()
      .references(() => recetas.id, { onDelete: "cascade" }),
    productoId: uuid("producto_id")
      .notNull()
      .references(() => productos.id, { onDelete: "restrict" }),
    cantidad: numeric("cantidad", { precision: 10, scale: 3 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.recetaId, table.productoId] }),
    check("receta_productos_cantidad_positive", sql`${table.cantidad} > 0`),
  ]
);

// Relations
export const recetasRelations = relations(recetas, ({ many }) => ({
  ingredientes: many(recetaProductos),
}));

export const recetaProductosRelations = relations(recetaProductos, ({ one }) => ({
  receta: one(recetas, {
    fields: [recetaProductos.recetaId],
    references: [recetas.id],
  }),
  producto: one(productos, {
    fields: [recetaProductos.productoId],
    references: [productos.id],
  }),
}));

export type RecetaProducto = typeof recetaProductos.$inferSelect;
export type NewRecetaProducto = typeof recetaProductos.$inferInsert;
