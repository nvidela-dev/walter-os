import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const recetas = pgTable("recetas", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Receta = typeof recetas.$inferSelect;
export type NewReceta = typeof recetas.$inferInsert;
