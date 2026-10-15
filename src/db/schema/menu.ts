import { relations, sql } from "drizzle-orm";
import { check, integer, jsonb, numeric, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import { recipes } from "./recipes";

export const menuSections = pgTable("menu_secciones", {
  id: uuid("id").primaryKey().defaultRandom(),
  menuName: text("carta").notNull(),
  name: text("nombre").notNull(),
  sortOrder: integer("orden").notNull().default(0),
}, (table) => [unique("menu_secciones_carta_nombre_unique").on(table.menuName, table.name)]);

export interface MenuPriceOption { label: string; price: string | null }

export const menu = pgTable(
  "menu",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("nombre").notNull(),
    description: text("descripcion"),
    sellPrice: numeric("precio_venta", { precision: 10, scale: 2 }),
    sectionId: uuid("seccion_id").references(() => menuSections.id, { onDelete: "restrict" }),
    priceOptions: jsonb("opciones_precio").$type<MenuPriceOption[]>().notNull().default([]),
    sourceKey: text("clave_fuente").unique(),
    sourceNote: text("fuente"),
    reviewNote: text("nota_revision"),
    sortOrder: integer("orden").notNull().default(0),
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
