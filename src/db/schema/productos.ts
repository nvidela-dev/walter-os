import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const productos = pgTable("productos", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  unidad: text("unidad").notNull().default("unidad"), // kg, unidad, litro, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Producto = typeof productos.$inferSelect;
export type NewProducto = typeof productos.$inferInsert;
