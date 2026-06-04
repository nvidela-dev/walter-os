import { relations, sql } from "drizzle-orm";
import { check, date, integer, numeric, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { empleados } from "./empleados";

export const horasExtra = pgTable(
  "horas_extra",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    empleadoId: uuid("empleado_id")
      .notNull()
      .references(() => empleados.id, { onDelete: "restrict" }),
    fecha: date("fecha").notNull(),
    horas: integer("horas").notNull(),
    montoPagado: numeric("monto_pagado", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    check("horas_extra_horas_positive", sql`${table.horas} > 0`),
    check("horas_extra_monto_pagado_positive", sql`${table.montoPagado} > 0`),
  ]
);

// Relations
export const empleadosRelations = relations(empleados, ({ many }) => ({
  horasExtra: many(horasExtra),
}));

export const horasExtraRelations = relations(horasExtra, ({ one }) => ({
  empleado: one(empleados, {
    fields: [horasExtra.empleadoId],
    references: [empleados.id],
  }),
}));

export type HoraExtra = typeof horasExtra.$inferSelect;
export type NewHoraExtra = typeof horasExtra.$inferInsert;
