import { sql } from "drizzle-orm";
import { check, numeric, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const proveedorTipo = pgEnum("proveedor_tipo", ["producto", "servicio"]);

export const proveedores = pgTable(
  "proveedores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nombre: text("nombre").notNull(),
    descripcion: text("descripcion"),
    tipo: proveedorTipo("tipo").notNull().default("producto"),
    dias: text("dias"), // Comma-separated days: "L,M,V"
    logoUrl: text("logo_url"),
    deuda: numeric("deuda", { precision: 10, scale: 2 }).default("0").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [check("proveedores_deuda_nonnegative", sql`${table.deuda} >= 0`)]
);

export type Proveedor = typeof proveedores.$inferSelect;
export type NewProveedor = typeof proveedores.$inferInsert;
export type ProveedorTipo = (typeof proveedorTipo.enumValues)[number];
