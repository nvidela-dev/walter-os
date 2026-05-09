import { pgTable, timestamp, uuid, numeric } from "drizzle-orm/pg-core";
import { productos } from "./productos";
import { proveedores } from "./proveedores";
import { unidades } from "./unidades";
import { facturas } from "./facturas";

export const historialPrecios = pgTable("historial_precios", {
  id: uuid("id").primaryKey().defaultRandom(),
  productoId: uuid("producto_id")
    .notNull()
    .references(() => productos.id, { onDelete: "cascade" }),
  proveedorId: uuid("proveedor_id")
    .notNull()
    .references(() => proveedores.id, { onDelete: "cascade" }),
  precio: numeric("precio", { precision: 10, scale: 2 }).notNull(),
  unidadId: uuid("unidad_id")
    .notNull()
    .references(() => unidades.id),
  facturaId: uuid("factura_id").references(() => facturas.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type HistorialPrecio = typeof historialPrecios.$inferSelect;
export type NewHistorialPrecio = typeof historialPrecios.$inferInsert;
