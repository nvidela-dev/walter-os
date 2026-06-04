import { sql } from "drizzle-orm";
import { check, integer, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const empleados = pgTable(
  "empleados",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nombre: text("nombre").notNull(),
    salarioMensual: numeric("salario_mensual", { precision: 10, scale: 2 }).notNull(),
    horasFijasSemanales: integer("horas_fijas_semanales").notNull().default(40),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    check("empleados_salario_mensual_positive", sql`${table.salarioMensual} > 0`),
    check("empleados_horas_fijas_semanales_positive", sql`${table.horasFijasSemanales} > 0`),
  ]
);

export type Empleado = typeof empleados.$inferSelect;
export type NewEmpleado = typeof empleados.$inferInsert;
