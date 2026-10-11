import { sql } from "drizzle-orm";
import { check, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { products } from "./products";

export const productMatches = pgTable("equivalencias_productos", {
  inventoryId: uuid("inventario_producto_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  catalogueId: uuid("catalogo_producto_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  status: text("estado").notNull(),
  reviewedBy: text("revisado_por").notNull(),
  reviewedAt: timestamp("revisado_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [primaryKey({ columns: [t.inventoryId, t.catalogueId] }), check("equivalencias_estado", sql`${t.status} in ('accepted', 'rejected')`)]);
