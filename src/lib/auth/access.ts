import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { inventoryEmails } from "@/db/schema";
import { t } from "@/i18n";
import { expectedActionError } from "@/lib/action-result";
import { isAllowedEmail, normalizeEmail } from "@/lib/auth/allowlist";

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

export async function requireAccess(area: "main" | "inventory"): Promise<string> {
  const { userId } = await auth();
  if (userId == null) throw expectedActionError(t.inventory.denied);
  const user = await currentUser();
  const email = user?.primaryEmailAddress;
  if (email?.verification?.status !== "verified") throw expectedActionError(t.inventory.denied);
  const allowed = area === "main"
    ? await isAllowedEmail(email.emailAddress)
    : await isInventoryEmail(email.emailAddress);
  if (!allowed) throw expectedActionError(t.inventory.denied);
  return userId;
}
