"use server";

import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { actionError, actionOk, type ActionResult, unknownActionError } from "@/lib/action-result";
import { requireAccess } from "@/lib/auth/access";
import { uuidSchema } from "@/lib/validation";

/** Archive only the reviewed duplicate; history and both identities remain intact. */
export async function archiveDuplicate(input: unknown): Promise<ActionResult> {
  const userId = await requireAccess("main");
  try {
    const { keepId, archiveId } = z.object({ keepId: uuidSchema, archiveId: uuidSchema }).parse(input);
    if (keepId === archiveId) return actionError("Elegí dos productos distintos.");
    const result = await db.execute<{ id: string }>(sql`
      update productos set eliminado_at = now(), eliminado_por = ${userId}, updated_at = now()
      where id = ${archiveId}::uuid and eliminado_at is null
      and exists (select 1 from productos kept where kept.id = ${keepId}::uuid and kept.eliminado_at is null)
      returning id
    `);
    if (result.rows.length === 0) return actionError("Uno de los productos ya no está activo. Actualizá la página.");
    revalidatePath("/", "layout");
    return actionOk(undefined);
  } catch (error) { return unknownActionError(error); }
}
