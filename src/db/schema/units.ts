import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const units = pgTable("unidades", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("codigo").notNull().unique(),
  name: text("nombre").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Unit = typeof units.$inferSelect;
export type NewUnit = typeof units.$inferInsert;
