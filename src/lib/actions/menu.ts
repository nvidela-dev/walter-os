"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { menu } from "@/db/schema";
import { t } from "@/i18n";
import { actionError, actionOk, type ActionResult, unknownActionError } from "@/lib/action-result";
import { uuidSchema } from "@/lib/validation";
import { menuItemInputSchema } from "@/lib/validators/menu";

export async function createMenuItem(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = menuItemInputSchema.safeParse(input);
  if (!parsed.success) return unknownActionError(parsed.error);

  try {
    const [created] = await db.insert(menu).values(parsed.data).returning({ id: menu.id });
    if (!created) return actionError(t.errors.menu.createFailed);
    revalidatePath("/menu");
    return actionOk(created);
  } catch (error) {
    return unknownActionError(error);
  }
}

export async function updateMenuItem(
  id: string,
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) return unknownActionError(parsedId.error);

  const parsed = menuItemInputSchema.safeParse(input);
  if (!parsed.success) return unknownActionError(parsed.error);

  try {
    const [updated] = await db
      .update(menu)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(menu.id, parsedId.data))
      .returning({ id: menu.id });

    if (!updated) return actionError(t.errors.menu.notFound);

    revalidatePath("/menu");
    revalidatePath(`/menu/${parsedId.data}`);
    return actionOk(updated);
  } catch (error) {
    return unknownActionError(error);
  }
}

export async function deleteMenuItem(id: string): Promise<ActionResult> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) return unknownActionError(parsedId.error);

  try {
    const [deleted] = await db
      .delete(menu)
      .where(eq(menu.id, parsedId.data))
      .returning({ id: menu.id });

    if (!deleted) return actionError(t.errors.menu.notFound);

    revalidatePath("/menu");
    return actionOk(undefined);
  } catch (error) {
    return unknownActionError(error);
  }
}
