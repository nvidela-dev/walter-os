import { sql } from "drizzle-orm";
import { bigint, boolean, check, date, index, numeric, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import { products } from "./products";

export const waitressEmails = pgTable("usuarios_bebidas", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const drinkItems = pgTable("inventario_bebidas_productos", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("producto_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  location: text("ubicacion").notNull(),
  targetQuantity: numeric("cantidad_objetivo", { precision: 12, scale: 2 }),
  targetUnit: text("unidad_objetivo"),
  active: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  unique("bebidas_producto_ubicacion_unique").on(table.productId, table.location),
  check("bebidas_objetivo_nonnegative", sql`${table.targetQuantity} >= 0 AND ${table.targetQuantity} < 10000000000`),
  check("bebidas_objetivo_unit_pair", sql`(${table.targetQuantity} IS NULL) = (${table.targetUnit} IS NULL)`),
]);

export const drinkObservations = pgTable("observaciones_bebidas", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  itemId: uuid("item_id").notNull().references(() => drinkItems.id, { onDelete: "restrict" }),
  week: date("semana").notNull().default(sql`public.inventory_week((now() AT TIME ZONE 'America/Montevideo')::date)`),
  name: text("nombre").notNull(),
  location: text("ubicacion").notNull(),
  quantity: numeric("cantidad", { precision: 12, scale: 2 }).notNull(),
  unit: text("unidad").notNull(),
  recordedAt: timestamp("registrado_at", { withTimezone: true }).defaultNow().notNull(),
  recordedBy: text("registrado_por").notNull(),
}, (table) => [
  check("bebidas_cantidad_nonnegative", sql`${table.quantity} >= 0 AND ${table.quantity} < 10000000000`),
  check("bebidas_semana_tuesday", sql`extract(dow FROM ${table.week}) = 2`),
  index("bebidas_latest_idx").on(table.week, table.itemId, table.recordedAt.desc(), table.id.desc()),
]);
