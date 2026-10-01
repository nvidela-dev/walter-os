import "server-only";

import { db } from "@/db";
import { allowedEmails, inventoryEmails } from "@/db/schema";
import { requireAccess } from "@/lib/auth/access";

export interface AccessMember {
  email: string;
  group: "admin" | "kitchen";
}

export async function getAccessMembers(): Promise<AccessMember[]> {
  await requireAccess("main");
  const [admins, kitchen] = await Promise.all([
    db.select({ email: allowedEmails.email }).from(allowedEmails),
    db.select({ email: inventoryEmails.email }).from(inventoryEmails),
  ]);
  const members = new Map<string, AccessMember>();
  for (const { email } of kitchen) members.set(email, { email, group: "kitchen" });
  for (const { email } of admins) members.set(email, { email, group: "admin" });
  return [...members.values()].sort((left, right) => left.email.localeCompare(right.email));
}
