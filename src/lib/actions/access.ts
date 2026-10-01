"use server";

import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { allowedEmails, inventoryEmails } from "@/db/schema";
import { t } from "@/i18n";
import { actionError, actionOk, type ActionResult, unknownActionError } from "@/lib/action-result";
import { requireAccess } from "@/lib/auth/access";
import { normalizeEmail } from "@/lib/auth/allowlist";
import { accessInputSchema } from "@/lib/validators/access";

export async function setAccessGroup(input: unknown): Promise<ActionResult> {
  await requireAccess("main");
  try {
    const { email, group } = accessInputSchema.parse(input);
    const user = await currentUser();
    const actorEmail = user?.primaryEmailAddress?.emailAddress;
    if (actorEmail == null) return actionError(t.inventory.denied);
    if (normalizeEmail(actorEmail) === email && group !== "admin") {
      return actionError(t.access.selfProtection);
    }
    if (group === "none") {
      await db.batch([
        db.delete(allowedEmails).where(eq(allowedEmails.email, email)),
        db.delete(inventoryEmails).where(eq(inventoryEmails.email, email)),
      ]);
    } else {
      const target = group === "admin" ? allowedEmails : inventoryEmails;
      const other = group === "admin" ? inventoryEmails : allowedEmails;
      await db.batch([
        db.delete(other).where(eq(other.email, email)),
        db.insert(target).values({ email }).onConflictDoNothing(),
      ]);
    }
    revalidatePath("/", "layout");
    return actionOk(undefined);
  } catch (error) { return unknownActionError(error); }
}
