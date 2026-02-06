import { pgTable, text, timestamp, uuid, numeric, integer } from "drizzle-orm/pg-core";

export const empleados = pgTable("empleados", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: text("nombre").notNull(),
  salarioMensual: numeric("salario_mensual", { precision: 10, scale: 2 }).notNull(),
  horasFijasSemanales: integer("horas_fijas_semanales").notNull().default(40),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Empleado = typeof empleados.$inferSelect;
export type NewEmpleado = typeof empleados.$inferInsert;
