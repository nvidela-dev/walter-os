/**
 * Email allowlist — the entire access-control policy for Walter OS.
 *
 * Clerk handles authentication (proving who you are); this list handles
 * authorization (whether you're allowed in at all). Anyone who signs in with
 * an email outside this set is bounced to `/not-authorized`. There are no
 * roles or permissions beyond membership in this list.
 *
 * To grant or revoke access, edit this array and redeploy.
 */
const ALLOWED_EMAILS = ["videla.jn@gmail.com", "edithgilda@gmail.com"] as const;

const allowedSet = new Set<string>(ALLOWED_EMAILS.map((email) => email.toLowerCase()));

/** True when `email` (case-insensitively) is permitted to use the app. */
export function isAllowedEmail(email: string | null | undefined): boolean {
  if (email == null || email.trim() === "") return false;
  return allowedSet.has(email.trim().toLowerCase());
}
