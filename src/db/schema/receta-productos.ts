import { pgTable, timestamp, uuid, numeric, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { recetas } from "./recetas";
import { productos } from "./productos";

export const recetaProductos = pgTable(
  "receta_productos",
  {
    recetaId: uuid("receta_id")
      .notNull()
      .references(() => recetas.id, { onDelete: "cascade" }),
    productoId: uuid("producto_id")
      .notNull()
      .references(() => productos.id, { onDelete: "cascade" }),
    cantidad: numeric("cantidad", { precision: 10, scale: 3 }).notNull(), // Amount needed (in producto.unidad)
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.recetaId, table.productoId] })]
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
