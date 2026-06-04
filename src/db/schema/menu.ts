import { relations, sql } from "drizzle-orm";
import { check, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { recipes } from "./recipes";

export const menu = pgTable(
  "menu",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("nombre").notNull(),
    description: text("descripcion"),
    sellPrice: numeric("precio_venta", { precision: 10, scale: 2 }).notNull(),
    recipeId: uuid("receta_id").references(() => recipes.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [check("menu_precio_venta_positive", sql`${table.sellPrice} > 0`)]
);

// Relations
export const menuRelations = relations(menu, ({ one }) => ({
  recipe: one(recipes, {
    fields: [menu.recipeId],
    references: [recipes.id],
  }),
}));

export type MenuItem = typeof menu.$inferSelect;
export type NewMenuItem = typeof menu.$inferInsert;
