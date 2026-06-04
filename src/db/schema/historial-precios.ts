import { sql } from "drizzle-orm";
import { check, numeric, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { productos } from "./productos";
import { proveedores } from "./proveedores";
import { unidades } from "./unidades";
import { facturas } from "./facturas";

export const historialPrecios = pgTable(
  "historial_precios",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productoId: uuid("producto_id")
      .notNull()
      .references(() => productos.id, { onDelete: "restrict" }),
    proveedorId: uuid("proveedor_id")
      .notNull()
      .references(() => proveedores.id, { onDelete: "restrict" }),
    precio: numeric("precio", { precision: 10, scale: 2 }).notNull(),
    unidadId: uuid("unidad_id")
      .notNull()
      .references(() => unidades.id),
    facturaId: uuid("factura_id").references(() => facturas.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [check("historial_precios_precio_positive", sql`${table.precio} > 0`)]
);

export type HistorialPrecio = typeof historialPrecios.$inferSelect;
export type NewHistorialPrecio = typeof historialPrecios.$inferInsert;
