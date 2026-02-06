import { pgTable, text, timestamp, uuid, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { recetas } from "./recetas";

export const menu = pgTable("menu", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  precioVenta: numeric("precio_venta", { precision: 10, scale: 2 }).notNull(),
  recetaId: uuid("receta_id").references(() => recetas.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const menuRelations = relations(menu, ({ one }) => ({
  receta: one(recetas, {
    fields: [menu.recetaId],
    references: [recetas.id],
  }),
}));

export type MenuItem = typeof menu.$inferSelect;
export type NewMenuItem = typeof menu.$inferInsert;
