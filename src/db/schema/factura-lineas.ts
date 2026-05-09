import { pgTable, timestamp, uuid, numeric } from "drizzle-orm/pg-core";
import { facturas } from "./facturas";
import { productos } from "./productos";
import { unidades } from "./unidades";

export const facturaLineas = pgTable("factura_lineas", {
  id: uuid("id").primaryKey().defaultRandom(),
  facturaId: uuid("factura_id")
    .notNull()
    .references(() => facturas.id, { onDelete: "cascade" }),
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
});

export type FacturaLinea = typeof facturaLineas.$inferSelect;
export type NewFacturaLinea = typeof facturaLineas.$inferInsert;
