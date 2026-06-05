import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Access-control allowlist. A signed-in user may use the app only if their
 * email has a row here (see `src/lib/auth/allowlist.ts`). This is the entire
 * authorization policy — there are no roles or permissions beyond membership.
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
