import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const recipes = pgTable("recetas", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("nombre").notNull(),
  description: text("descripcion"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Recipe = typeof recipes.$inferSelect;
export type NewRecipe = typeof recipes.$inferInsert;
