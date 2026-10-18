"use server";

import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { actionError, actionOk, type ActionResult } from "@/lib/action-result";
import { getCurrentGroup, requireAccess } from "@/lib/auth/access";
import { uuidSchema } from "@/lib/validation";

export async function deleteSavedInventory(kind: "food" | "drinks", id: string, token: string): Promise<ActionResult> {
  const actor = await requireAccess(kind === "food" ? "inventory" : "drinks");
  try {
    if (kind === "drinks") {
      uuidSchema.parse(id);
      const revision = Number(token);
      if (!Number.isSafeInteger(revision) || revision < 0) return actionError("Revisión inválida.");
      await db.execute(sql`SELECT public.delete_drink_document(${id}::uuid,${revision},${actor},${await getCurrentGroup() === "admin"})`);
    } else {
      // Food runs are shared; only Admin may remove an entire weekly record.
      await requireAccess("main");
      if (!/^\d+$/.test(id) || !/^[a-f0-9]{32}$/.test(token)) return actionError("Inventario inválido.");
      await db.execute(sql`SELECT public.delete_inventory_run(${id}::bigint,${token})`);
    }
    revalidatePath(kind === "food" ? "/inventory" : "/drinks", "layout");
    return actionOk(undefined);
  } catch {
    return actionError("No se pudo eliminar. Verificá tus permisos y recargá: el inventario puede haber cambiado.");
  }
}
