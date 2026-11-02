import { relations, sql } from "drizzle-orm";
import { check, foreignKey, index, integer, jsonb, numeric, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import type { MenuDocument } from "@/lib/menu/versions";

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

export const menuVersions = pgTable("menu_versiones", {
  id: uuid("id").primaryKey().defaultRandom(),
  menuName: text("carta").notNull(),
  status: text("estado").$type<"draft" | "submitted">().notNull().default("draft"),
  baseVersionId: uuid("version_base_id"),
  revision: integer("revision").notNull().default(0),
  document: jsonb("contenido").$type<MenuDocument>().notNull(),
  createdAt: timestamp("created_at", {withTimezone: true}).notNull().defaultNow(),
  submittedAt: timestamp("presentado_at", {withTimezone: true}),
  createdBy: text("creado_por").notNull(),
  submittedBy: text("presentado_por"),
}, table => [check("menu_versiones_estado_check", sql`${table.status} in ('draft','submitted')`),
  foreignKey({name:"menu_versiones_base_fk",columns:[table.baseVersionId],foreignColumns:[table.id]}).onDelete("restrict"),
  index("menu_versiones_carta_estado_fecha").on(table.menuName,table.status,table.submittedAt.desc()),
  check("menu_versiones_revision_check",sql`${table.revision} >= 0`),
  check("menu_versiones_snapshot_check",sql`(${table.status}='draft' AND ${table.submittedAt} IS NULL AND ${table.submittedBy} IS NULL) OR (${table.status}='submitted' AND ${table.submittedAt} IS NOT NULL AND ${table.submittedBy} IS NOT NULL)`),
]);

// Activation is a pointer; submitted snapshots remain completely immutable.
export const activeMenus = pgTable("menus_activos", {
  menuName: text("carta").primaryKey(),
  versionId: uuid("version_id").notNull().references(() => menuVersions.id, {onDelete:"restrict"}),
});
