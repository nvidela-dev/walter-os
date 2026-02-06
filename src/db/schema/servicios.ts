import { pgTable, text, timestamp, uuid, numeric } from "drizzle-orm/pg-core";

export const servicios = pgTable("servicios", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  montoFijo: numeric("monto_fijo", { precision: 10, scale: 2 }).notNull(),
  frecuencia: text("frecuencia").notNull().default("mensual"), // mensual, bimestral, trimestral, anual
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Servicio = typeof servicios.$inferSelect;
export type NewServicio = typeof servicios.$inferInsert;
