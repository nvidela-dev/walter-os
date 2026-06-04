import { relations, sql } from "drizzle-orm";
import { check, numeric, pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";

import { productos } from "./productos";
import { proveedores } from "./proveedores";

export const proveedorProductos = pgTable(
  "proveedor_productos",
  {
    proveedorId: uuid("proveedor_id")
      .notNull()
      .references(() => proveedores.id, { onDelete: "restrict" }),
    productoId: uuid("producto_id")
      .notNull()
      .references(() => productos.id, { onDelete: "restrict" }),
    precio: numeric("precio", { precision: 10, scale: 2 }).notNull(),
    cantidad: numeric("cantidad", { precision: 10, scale: 2 }).notNull().default("1"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.proveedorId, table.productoId] }),
    check("proveedor_productos_precio_positive", sql`${table.precio} > 0`),
    check("proveedor_productos_cantidad_positive", sql`${table.cantidad} > 0`),
  ]
);

// Relations
export const proveedoresRelations = relations(proveedores, ({ many }) => ({
  productos: many(proveedorProductos),
}));

export const productosRelations = relations(productos, ({ many }) => ({
  proveedores: many(proveedorProductos),
}));

export const proveedorProductosRelations = relations(
  proveedorProductos,
  ({ one }) => ({
    proveedor: one(proveedores, {
      fields: [proveedorProductos.proveedorId],
      references: [proveedores.id],
    }),
    producto: one(productos, {
      fields: [proveedorProductos.productoId],
      references: [productos.id],
    }),
  })
);

export type ProveedorProducto = typeof proveedorProductos.$inferSelect;
export type NewProveedorProducto = typeof proveedorProductos.$inferInsert;
