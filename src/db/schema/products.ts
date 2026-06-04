import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { units } from "./units";

export const products = pgTable("productos", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("nombre").notNull(),
  description: text("descripcion"),
  // Legacy text column kept until follow-up cleanup migration. New writes
  // populate it alongside unidad_id so a rollback can read the old field.
  unit: text("unidad").notNull().default("unidad"),
  unitId: uuid("unidad_id").references(() => units.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
