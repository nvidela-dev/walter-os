import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Admin group membership, using the existing physical allowlist table.
 * Admin has main-app and inventory access. Inventory-only membership is Kitchen.
 * Emails are normalized (trimmed/lowercased); no row means no Admin permission.
 */
export const allowedEmails = pgTable("usuarios_autorizados", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AllowedEmail = typeof allowedEmails.$inferSelect;
export type NewAllowedEmail = typeof allowedEmails.$inferInsert;
