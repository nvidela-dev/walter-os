import { sql } from "drizzle-orm";
import { bigint, check, foreignKey, index, numeric, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import { products } from "./products";

/** Revisions are immutable; quantities are global totals across fridge placements. */
export const inventoryTargetHistory = pgTable("historial_objetivos_inventario", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  productId: uuid("producto_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  quantity: numeric("cantidad", { precision: 12, scale: 2 }).notNull(),
  unit: text("unidad").notNull(),
  recordedAt: timestamp("registrado_at", { withTimezone: true }).notNull().defaultNow(),
  recordedBy: text("registrado_por").notNull(),
}, (table) => [
  check("objetivos_cantidad_nonnegative", sql`${table.quantity} >= 0 AND ${table.quantity} < 10000000000`),
  unique("objetivos_id_product_unique").on(table.id, table.productId),
  index("objetivos_history_idx").on(table.productId, table.id.desc()),
]);

/** An insert trigger advances this single pointer per product atomically. */
export const inventoryTargets = pgTable("objetivos_inventario_activos", {
  productId: uuid("producto_id").primaryKey(),
  targetId: bigint("objetivo_id", { mode: "number" }).notNull(),
}, (table) => [foreignKey({ columns: [table.targetId, table.productId], foreignColumns: [inventoryTargetHistory.id, inventoryTargetHistory.productId] }).onDelete("restrict")]);
