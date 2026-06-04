import { relations, sql } from "drizzle-orm";
import { check, date, integer, numeric, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

import { employees } from "./employees";

export const extraHours = pgTable(
  "horas_extra",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeId: uuid("empleado_id")
      .notNull()
      .references(() => employees.id, { onDelete: "restrict" }),
    date: date("fecha").notNull(),
    hours: integer("horas").notNull(),
    amountPaid: numeric("monto_pagado", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    check("horas_extra_horas_positive", sql`${table.hours} > 0`),
    check("horas_extra_monto_pagado_positive", sql`${table.amountPaid} > 0`),
  ]
);

// Relations
export const employeesRelations = relations(employees, ({ many }) => ({
  extraHours: many(extraHours),
}));

export const extraHoursRelations = relations(extraHours, ({ one }) => ({
  employee: one(employees, {
    fields: [extraHours.employeeId],
    references: [employees.id],
  }),
}));

export type ExtraHour = typeof extraHours.$inferSelect;
export type NewExtraHour = typeof extraHours.$inferInsert;
