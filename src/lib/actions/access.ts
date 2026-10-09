"use server";

import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { allowedEmails, inventoryEmails, waitressEmails } from "@/db/schema";
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
    const memberships = { admin: allowedEmails, kitchen: inventoryEmails, waitress: waitressEmails };
    const removals = Object.entries(memberships)
      .filter(([name]) => name !== group)
      .map(([, table]) => db.delete(table).where(eq(table.email, email)));
    if (group === "none") await db.batch([
      db.delete(allowedEmails).where(eq(allowedEmails.email, email)),
      db.delete(inventoryEmails).where(eq(inventoryEmails.email, email)),
      db.delete(waitressEmails).where(eq(waitressEmails.email, email)),
    ]);
    else await db.batch([
      db.insert(memberships[group]).values({ email }).onConflictDoNothing(),
      ...removals,
    ]);
    revalidatePath("/", "layout");
    return actionOk(undefined);
  } catch (error) { return unknownActionError(error); }
}
