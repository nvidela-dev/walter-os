import { sql } from "drizzle-orm";
import { boolean, check, date, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { proveedores } from "./proveedores";

export const facturas = pgTable(
  "facturas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    proveedorId: uuid("proveedor_id")
      .notNull()
      .references(() => proveedores.id, { onDelete: "restrict" }),
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
  },
  (table) => [
    check("facturas_total_positive", sql`${table.total} > 0`),
    check("facturas_monto_positive", sql`${table.monto} IS NULL OR ${table.monto} > 0`),
  ]
);

export type Factura = typeof facturas.$inferSelect;
export type NewFactura = typeof facturas.$inferInsert;
