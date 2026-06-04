import { sql } from "drizzle-orm";
import { check, numeric, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const providerType = pgEnum("proveedor_tipo", ["producto", "servicio"]);

export const providers = pgTable(
  "proveedores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("nombre").notNull(),
    description: text("descripcion"),
    type: providerType("tipo").notNull().default("producto"),
    days: text("dias"), // Comma-separated days: "L,M,V"
    logoUrl: text("logo_url"),
    debt: numeric("deuda", { precision: 10, scale: 2 }).default("0").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [check("proveedores_deuda_nonnegative", sql`${table.debt} >= 0`)]
);

export type Provider = typeof providers.$inferSelect;
export type NewProvider = typeof providers.$inferInsert;
export type ProviderType = (typeof providerType.enumValues)[number];
