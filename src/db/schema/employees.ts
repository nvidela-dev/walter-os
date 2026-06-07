import { sql } from "drizzle-orm";
import { check, integer, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const employees = pgTable(
  "empleados",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("nombre").notNull(),
    hourlyRate: numeric("tarifa_hora", { precision: 10, scale: 2 }).notNull(),
    extraHourRate: numeric("tarifa_hora_extra", { precision: 10, scale: 2 }).notNull(),
    fixedWeeklyHours: integer("horas_fijas_semanales").notNull().default(40),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    check("empleados_tarifa_hora_positive", sql`${table.hourlyRate} > 0`),
    check("empleados_tarifa_hora_extra_positive", sql`${table.extraHourRate} > 0`),
    check("empleados_horas_fijas_semanales_positive", sql`${table.fixedWeeklyHours} > 0`),
  ]
);

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
