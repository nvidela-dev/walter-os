import { pgTable, text, timestamp, uuid, numeric, boolean, date } from "drizzle-orm/pg-core";
import { proveedores } from "./proveedores";

export const facturas = pgTable("facturas", {
  id: uuid("id").primaryKey().defaultRandom(),
  proveedorId: uuid("proveedor_id")
    .notNull()
    .references(() => proveedores.id, { onDelete: "cascade" }),
  fecha: date("fecha").notNull(),
  numero: text("numero"),
  // Set on service-type facturas: a single fixed amount instead of line items.
  // Mutually exclusive with factura_lineas — enforced in the createFactura
  // server action; not as a DB constraint since it spans two tables.
  monto: numeric("monto", { precision: 12, scale: 2 }),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  paid: boolean("paid").notNull().default(false),
  notas: text("notas"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Factura = typeof facturas.$inferSelect;
export type NewFactura = typeof facturas.$inferInsert;
