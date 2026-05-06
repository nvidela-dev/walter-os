import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { unidades } from "./unidades";

export const productos = pgTable("productos", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  // Legacy text column kept until follow-up cleanup migration. New writes
  // populate it alongside unidad_id so a rollback can read the old field.
  unidad: text("unidad").notNull().default("unidad"),
  unidadId: uuid("unidad_id").references(() => unidades.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Producto = typeof productos.$inferSelect;
export type NewProducto = typeof productos.$inferInsert;
