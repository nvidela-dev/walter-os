import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { inventoryEmails, waitressEmails } from "@/db/schema";
import { t } from "@/i18n";
import { expectedActionError } from "@/lib/action-result";
import { isAllowedEmail, normalizeEmail } from "@/lib/auth/allowlist";
import { type AccessArea, type AccessGroup,canAccess } from "@/lib/auth/policy";

export async function isInventoryEmail(email: string | null | undefined): Promise<boolean> {
  if (email == null || email.trim() === "") return false;
  try {
    const [row] = await db.select({ id: inventoryEmails.id }).from(inventoryEmails)
      .where(eq(inventoryEmails.email, normalizeEmail(email))).limit(1);
    return row != null;
  } catch {
    return false;
  }
}

export async function isWaitressEmail(email: string | null | undefined): Promise<boolean> {
  if (email == null || email.trim() === "") return false;
  try {
    const [row] = await db.select({ id: waitressEmails.id }).from(waitressEmails)
      .where(eq(waitressEmails.email, normalizeEmail(email))).limit(1);
    return row != null;
  } catch { return false; }
}

/** Existing main membership is Admin; inventory-only membership is Kitchen. */
export async function getAccessGroup(email: string | null | undefined): Promise<AccessGroup> {
  if (email == null || email.trim() === "") return null;
  if (await isAllowedEmail(email)) return "admin";
  if (await isWaitressEmail(email)) return "waitress";
  if (await isInventoryEmail(email)) return "kitchen";
  return null;
}

export async function getCurrentGroup(): Promise<AccessGroup> {
  const user = await currentUser();
  const email = user?.primaryEmailAddress;
  if (email?.verification?.status !== "verified") return null;
  return getAccessGroup(email.emailAddress);
}

export async function requireAccess(area: AccessArea): Promise<string> {
  const { userId } = await auth();
  if (userId == null || !canAccess(await getCurrentGroup(), area)) {
    throw expectedActionError(t.inventory.denied);
  }
  return userId;
}
