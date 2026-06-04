"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { menu, type MenuItem, recipes } from "@/db/schema";
import { t } from "@/i18n";
import { actionError, actionOk, type ActionResult, unknownActionError } from "@/lib/action-result";
import { moneySchema, optionalTextSchema, requiredTextSchema, uuidSchema } from "@/lib/validation";

const menuItemInputSchema = z.object({
  name: requiredTextSchema,
  description: optionalTextSchema,
  sellPrice: moneySchema,
  recipeId: z
    .string()
    .trim()
    .transform((value) => (value.length > 0 ? value : null))
    .pipe(uuidSchema.nullable()),
});

export type MenuItemInput = z.infer<typeof menuItemInputSchema>;

export interface MenuItemRow {
  id: string;
  name: string;
  description: string | null;
  sellPrice: string;
  recipeId: string | null;
  recipeName: string | null;
}

export async function getMenuItems(): Promise<MenuItemRow[]> {
  return db
    .select({
      id: menu.id,
      name: menu.name,
      description: menu.description,
      sellPrice: menu.sellPrice,
      recipeId: menu.recipeId,
      recipeName: recipes.name,
    })
    .from(menu)
    .leftJoin(recipes, eq(menu.recipeId, recipes.id))
    .orderBy(menu.name);
}

export async function getMenuItem(id: string): Promise<MenuItem | null> {
  const result = await db.select().from(menu).where(eq(menu.id, id));
  return result[0] ?? null;
}

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

export async function getAllRecipes(): Promise<{ id: string; name: string }[]> {
  return db.select({ id: recipes.id, name: recipes.name }).from(recipes).orderBy(recipes.name);
}
