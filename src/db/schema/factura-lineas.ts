import { sql } from "drizzle-orm";
import { check, numeric, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { facturas } from "./facturas";
import { productos } from "./productos";
import { unidades } from "./unidades";

export const facturaLineas = pgTable(
  "factura_lineas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    facturaId: uuid("factura_id")
      .notNull()
      .references(() => facturas.id, { onDelete: "restrict" }),
    productoId: uuid("producto_id")
      .notNull()
      .references(() => productos.id, { onDelete: "restrict" }),
    unidadId: uuid("unidad_id")
      .notNull()
      .references(() => unidades.id),
    precioUnit: numeric("precio_unit", { precision: 10, scale: 2 }).notNull(),
    cantidad: numeric("cantidad", { precision: 10, scale: 2 }).notNull(),
    total: numeric("total", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    check("factura_lineas_precio_unit_positive", sql`${table.precioUnit} > 0`),
    check("factura_lineas_cantidad_positive", sql`${table.cantidad} > 0`),
    check("factura_lineas_total_positive", sql`${table.total} > 0`),
  ]
);

export type FacturaLinea = typeof facturaLineas.$inferSelect;
export type NewFacturaLinea = typeof facturaLineas.$inferInsert;
