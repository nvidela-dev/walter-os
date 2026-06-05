import { eq } from "drizzle-orm";

import { db } from "@/db";
import { allowedEmails } from "@/db/schema";

/**
 * Email allowlist — the entire access-control policy for Walter OS.
 *
 * Clerk handles authentication (proving who you are); the `usuarios_autorizados`
 * table handles authorization (whether you're allowed in at all). Anyone who
 * signs in with an email that has no row there is bounced to `/not-authorized`.
 * There are no roles or permissions beyond membership in the table.
 *
 * To grant or revoke access, insert/delete a row (emails stored lowercased).
 */

/** Normalize an email for storage and comparison. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * True when `email` (case-insensitively) has a row in the allowlist table.
 *
 * Fails closed: any error reaching the table (missing migration, DB outage,
 * bad connection string) is swallowed and treated as "not allowed" so the
 * middleware redirects to /not-authorized instead of throwing a 500. A
 * security gate must never grant access when it can't verify membership.
 */
export async function isAllowedEmail(email: string | null | undefined): Promise<boolean> {
  if (email == null || email.trim() === "") return false;

  try {
    const [row] = await db
      .select({ id: allowedEmails.id })
      .from(allowedEmails)
      .where(eq(allowedEmails.email, normalizeEmail(email)))
      .limit(1);

    return row != null;
  } catch (error) {
    console.error("[allowlist] failed to query usuarios_autorizados; denying access", error);
    return false;
  }
}
