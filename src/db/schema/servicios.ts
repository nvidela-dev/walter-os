import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const servicios = pgTable("servicios", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Servicio = typeof servicios.$inferSelect;
export type NewServicio = typeof servicios.$inferInsert;
