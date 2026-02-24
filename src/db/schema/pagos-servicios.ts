import { pgTable, text, timestamp, uuid, numeric, date } from "drizzle-orm/pg-core";
import { servicios } from "./servicios";

export const pagosServicios = pgTable("pagos_servicios", {
  id: uuid("id").primaryKey().defaultRandom(),
  servicioId: uuid("servicio_id")
    .notNull()
    .references(() => servicios.id, { onDelete: "cascade" }),
  monto: numeric("monto", { precision: 10, scale: 2 }).notNull(),
  fecha: date("fecha").notNull(),
  notas: text("notas"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type PagoServicio = typeof pagosServicios.$inferSelect;
export type NewPagoServicio = typeof pagosServicios.$inferInsert;
