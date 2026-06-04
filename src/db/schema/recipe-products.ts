import { relations, sql } from "drizzle-orm";
import { check, numeric, pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";

import { products } from "./products";
import { recipes } from "./recipes";

export const recipeProducts = pgTable(
  "receta_productos",
  {
    recipeId: uuid("receta_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    productId: uuid("producto_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    quantity: numeric("cantidad", { precision: 10, scale: 3 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.recipeId, table.productId] }),
    check("receta_productos_cantidad_positive", sql`${table.quantity} > 0`),
  ]
);

// Relations
export const recipesRelations = relations(recipes, ({ many }) => ({
  ingredients: many(recipeProducts),
}));

export const recipeProductsRelations = relations(recipeProducts, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeProducts.recipeId],
    references: [recipes.id],
  }),
  product: one(products, {
    fields: [recipeProducts.productId],
    references: [products.id],
  }),
}));

export type RecipeProduct = typeof recipeProducts.$inferSelect;
export type NewRecipeProduct = typeof recipeProducts.$inferInsert;
