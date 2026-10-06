import { sql } from "drizzle-orm";
import { bigint, boolean, check, foreignKey, index, integer, numeric, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { products } from "./products";

// Kitchen membership. Admin access is inherited from usuarios_autorizados.
export const inventoryEmails = pgTable("usuarios_inventario", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const fridges = pgTable("heladeras", {
  id: uuid("id").primaryKey().defaultRandom(),
  number: integer("numero").notNull().unique(),
  name: text("nombre"),
  active: boolean("activa").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [check("heladeras_numero_positive", sql`${table.number} > 0`)]);

export const fridgeProducts = pgTable("heladera_productos", {
  note: text("nota"),
  active: boolean("activo").notNull().default(true),
  fridgeId: uuid("heladera_id").notNull().references(() => fridges.id, { onDelete: "restrict" }),
  productId: uuid("producto_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [primaryKey({ columns: [table.fridgeId, table.productId] })]);

export const inventoryObservations = pgTable("observaciones_inventario", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  fridgeId: uuid("heladera_id").notNull(),
  productId: uuid("producto_id").notNull(),
  quantity: numeric("cantidad", { precision: 12, scale: 2 }).notNull(),
  // Snapshot the counted unit so future catalogue edits cannot relabel history.
  unit: text("unidad").notNull(),
  recordedAt: timestamp("registrado_at", { withTimezone: true }).defaultNow().notNull(),
  recordedBy: text("registrado_por").notNull(),
}, (table) => [
  foreignKey({ columns: [table.fridgeId, table.productId], foreignColumns: [fridgeProducts.fridgeId, fridgeProducts.productId] }).onDelete("restrict"),
  check("observaciones_cantidad_nonnegative", sql`${table.quantity} >= 0 AND ${table.quantity} < 10000000000`),
  index("observaciones_latest_idx").on(table.fridgeId, table.productId, table.recordedAt.desc(), table.id.desc()),
]);
