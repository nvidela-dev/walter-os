import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Main-app allowlist. A signed-in user may use the main app only if their
 * email has a row here (see `src/lib/auth/allowlist.ts`). This is the entire
 * main-app policy; inventory has an independent membership table.
 *
 * Emails are stored normalized (trimmed, lowercased); the unique constraint
 * keeps the list deduplicated.
 */
export const allowedEmails = pgTable("usuarios_autorizados", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AllowedEmail = typeof allowedEmails.$inferSelect;
export type NewAllowedEmail = typeof allowedEmails.$inferInsert;
