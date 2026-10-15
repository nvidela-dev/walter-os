import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { menuVersions } from "@/db/schema";
import { requireAccess } from "@/lib/auth/access";
import { parseUuidOrNull } from "@/lib/validation";

export async function getMenuVersions(): Promise<Omit<typeof menuVersions.$inferSelect, "document">[]> {
  await requireAccess("main");
  return db.select({id: menuVersions.id, menuName: menuVersions.menuName, status: menuVersions.status, baseVersionId: menuVersions.baseVersionId, revision: menuVersions.revision, createdAt: menuVersions.createdAt, submittedAt: menuVersions.submittedAt, createdBy: menuVersions.createdBy, submittedBy: menuVersions.submittedBy}).from(menuVersions).orderBy(menuVersions.menuName,desc(menuVersions.submittedAt),desc(menuVersions.createdAt));
}
export async function getMenuVersion(id: string): Promise<typeof menuVersions.$inferSelect | null> {
  await requireAccess("main");
  if (parseUuidOrNull(id) === null) return null;
  const [version] = await db.select().from(menuVersions).where(eq(menuVersions.id,id));
  return version ?? null;
}
export async function getLatestMenuVersion(menuName: string): Promise<typeof menuVersions.$inferSelect | null> {
  await requireAccess("main");
  const [version] = await db.select().from(menuVersions).where(and(eq(menuVersions.menuName,menuName),eq(menuVersions.status,"submitted"))).orderBy(desc(menuVersions.submittedAt),desc(menuVersions.id)).limit(1);
  return version ?? null;
}
