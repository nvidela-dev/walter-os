import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { menu, recipes } from "@/db/schema";
import type { MenuItemRow, MenuItemView, RecipeOption } from "@/lib/types/menu";
import { parseUuidOrNull } from "@/lib/validation";

const menuItemSelection = {
  id: menu.id,
  name: menu.name,
  description: menu.description,
  sellPrice: menu.sellPrice,
  recipeId: menu.recipeId,
};

export async function getMenuItems(): Promise<MenuItemRow[]> {
  return db
    .select({
      ...menuItemSelection,
      recipeName: recipes.name,
    })
    .from(menu)
    .leftJoin(recipes, eq(menu.recipeId, recipes.id))
    .orderBy(menu.name);
}

export async function getMenuItem(id: string): Promise<MenuItemView | null> {
  const parsedId = parseUuidOrNull(id);
  if (parsedId === null) return null;

  const [item] = await db.select(menuItemSelection).from(menu).where(eq(menu.id, parsedId));
  return item ?? null;
}

export async function getRecipeOptions(): Promise<RecipeOption[]> {
  return db.select({ id: recipes.id, name: recipes.name }).from(recipes).orderBy(recipes.name);
}
