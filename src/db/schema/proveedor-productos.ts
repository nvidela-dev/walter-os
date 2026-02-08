import { pgTable, timestamp, uuid, numeric, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { proveedores } from "./proveedores";
import { productos } from "./productos";

export const proveedorProductos = pgTable(
  "proveedor_productos",
  {
    proveedorId: uuid("proveedor_id")
      .notNull()
      .references(() => proveedores.id, { onDelete: "cascade" }),
    productoId: uuid("producto_id")
      .notNull()
      .references(() => productos.id, { onDelete: "cascade" }),
    precio: numeric("precio", { precision: 10, scale: 2 }).notNull(),
    cantidad: numeric("cantidad", { precision: 10, scale: 2 }).notNull().default("1"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.proveedorId, table.productoId] })]
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
