import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const unidades = pgTable("unidades", {
  id: uuid("id").primaryKey().defaultRandom(),
  codigo: text("codigo").notNull().unique(),
  nombre: text("nombre").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Unidad = typeof unidades.$inferSelect;
export type NewUnidad = typeof unidades.$inferInsert;
