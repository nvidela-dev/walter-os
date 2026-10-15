"use server";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { menuVersions } from "@/db/schema";
import { actionError, actionOk, type ActionResult, unknownActionError } from "@/lib/action-result";
import { requireAccess } from "@/lib/auth/access";
import { menuDocumentSchema } from "@/lib/menu/versions";
import { getLatestMenuVersion } from "@/lib/queries/menu-versions";
import { requiredTextSchema, uuidSchema } from "@/lib/validation";

export async function createMenuDraft(menuName: string): Promise<ActionResult<{id: string}>> {
  const actor = await requireAccess("main");
  try {
    const family = requiredTextSchema.parse(menuName);
    const latest = await getLatestMenuVersion(family);
    if (latest === null && !["Don Juan","Genüsse"].includes(family)) return actionError("Carta no encontrada.");
    const [draft] = await db.insert(menuVersions).values({menuName:family,createdBy:actor,baseVersionId:latest?.id ?? null,document:latest?.document ?? {sections:[],items:[]}}).returning({id:menuVersions.id});
    if (!draft) return actionError("No se pudo crear el borrador.");
    revalidatePath("/menu");
    return actionOk(draft);
  } catch(error) { return unknownActionError(error); }
}
export async function saveMenuDraft(id: string, revision: number, input: unknown): Promise<ActionResult<{revision: number}>> {
  await requireAccess("main");
  try {
    uuidSchema.parse(id);
    if (!Number.isSafeInteger(revision) || revision < 0) return actionError("Revisión inválida.");
    const parsed = menuDocumentSchema.safeParse(input);
    if (!parsed.success) return actionError(parsed.error.issues.slice(0,3).map(issue => issue.message).join(" "));
    const document = parsed.data;
    const [saved] = await db.update(menuVersions).set({document,revision:sql`${menuVersions.revision}+1`}).where(and(eq(menuVersions.id,id),eq(menuVersions.revision,revision),eq(menuVersions.status,"draft"))).returning({revision:menuVersions.revision});
    if (!saved) return actionError("Este borrador cambió o ya fue presentado. Recargá antes de continuar.");
    return actionOk(saved);
  } catch(error) { return unknownActionError(error); }
}
export async function rebaseMenuDraft(id: string, revision: number): Promise<ActionResult> {
  await requireAccess("main");
  try {
    uuidSchema.parse(id);
    if (!Number.isSafeInteger(revision) || revision < 0) return actionError("Revisión inválida.");
    const rows = await db.execute(sql`UPDATE public.menu_versiones d SET version_base_id=(SELECT id FROM public.menu_versiones WHERE carta=d.carta AND estado='submitted' ORDER BY presentado_at DESC,id DESC LIMIT 1),revision=revision+1 WHERE d.id=${id}::uuid AND d.revision=${revision} AND d.estado='draft' RETURNING d.id`);
    if (rows.rows.length === 0) return actionError("El borrador cambió. Recargá para continuar.");
    revalidatePath("/menu","layout");
    return actionOk(undefined);
  } catch(error) { return unknownActionError(error); }
}
export async function submitMenuDraft(id: string, revision: number, baseId: string | null): Promise<ActionResult> {
  const actor = await requireAccess("main");
  try {
    uuidSchema.parse(id); if(baseId !== null) uuidSchema.parse(baseId);
    if (!Number.isSafeInteger(revision) || revision < 0) return actionError("Revisión inválida.");
    await db.execute(sql`SELECT public.submit_menu_version(${id}::uuid,${revision},${baseId}::uuid,${actor})`);
    revalidatePath("/menu","layout");
    return actionOk(undefined);
  } catch(error) {
    const message = String(error instanceof Error ? error.message + String(error.cause) : error);
    if(message.includes("menu_conflict")) return actionError("El borrador o la última carta cambiaron. Volvé a comparar antes de presentar.");
    if(message.includes("menu_empty")) return actionError("Agregá al menos un ítem antes de presentar.");
    return unknownActionError(error);
  }
}
