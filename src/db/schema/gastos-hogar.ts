import { pgTable, text, timestamp, uuid, numeric } from "drizzle-orm/pg-core";

export const gastosHogar = pgTable("gastos_hogar", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  monto: numeric("monto", { precision: 10, scale: 2 }).notNull(),
  frecuencia: text("frecuencia").notNull().default("mensual"), // mensual, bimestral, trimestral, anual
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type GastoHogar = typeof gastosHogar.$inferSelect;
export type NewGastoHogar = typeof gastosHogar.$inferInsert;
