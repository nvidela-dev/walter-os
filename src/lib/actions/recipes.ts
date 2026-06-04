"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { recipes } from "@/db/schema";
import { t } from "@/i18n";
import { actionError, actionOk, type ActionResult, unknownActionError } from "@/lib/action-result";
import { uuidSchema } from "@/lib/validation";
import { recipeInputSchema } from "@/lib/validators/recipes";

export async function createRecipe(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = recipeInputSchema.safeParse(input);
  if (!parsed.success) return unknownActionError(parsed.error);

  try {
    const [created] = await db.insert(recipes).values(parsed.data).returning({ id: recipes.id });
    if (!created) return actionError(t.errors.recipe.createFailed);
    revalidatePath("/recipes");
    return actionOk(created);
  } catch (error) {
    return unknownActionError(error);
  }
}

export async function updateRecipe(
  id: string,
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) return unknownActionError(parsedId.error);

  const parsed = recipeInputSchema.safeParse(input);
  if (!parsed.success) return unknownActionError(parsed.error);

  try {
    const [updated] = await db
      .update(recipes)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(recipes.id, parsedId.data))
      .returning({ id: recipes.id });

    if (!updated) return actionError(t.errors.recipe.notFound);

    revalidatePath("/recipes");
    revalidatePath(`/recipes/${parsedId.data}`);
    return actionOk(updated);
  } catch (error) {
    return unknownActionError(error);
  }
}

export async function deleteRecipe(id: string): Promise<ActionResult> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) return unknownActionError(parsedId.error);

  try {
    const [deleted] = await db
      .delete(recipes)
      .where(eq(recipes.id, parsedId.data))
      .returning({ id: recipes.id });

    if (!deleted) return actionError(t.errors.recipe.notFound);

    revalidatePath("/recipes");
    return actionOk(undefined);
  } catch (error) {
    return unknownActionError(error);
  }
}
