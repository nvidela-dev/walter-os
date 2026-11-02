import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { menu, menuSections, recipes } from "@/db/schema";
import { requireAccess } from "@/lib/auth/access";
import type { MenuItemRow, MenuItemView, RecipeOption } from "@/lib/types/menu";
import { parseUuidOrNull } from "@/lib/validation";

const menuItemSelection = {
  id: menu.id,
  name: menu.name,
  description: menu.description,
  sellPrice: menu.sellPrice,
  recipeId: menu.recipeId,
  sectionId: menu.sectionId, priceOptions: menu.priceOptions,
  sourceNote: menu.sourceNote, reviewNote: menu.reviewNote, sortOrder: menu.sortOrder,
};

export async function getMenuItems(): Promise<MenuItemRow[]> {
  await requireAccess("main");
  return db
    .select({
      ...menuItemSelection,
      recipeName: recipes.name, sectionName: menuSections.name, menuName: menuSections.menuName,
    })
    .from(menu)
    .leftJoin(menuSections, eq(menu.sectionId, menuSections.id))
    .leftJoin(recipes, eq(menu.recipeId, recipes.id))
    .orderBy(menuSections.menuName, menuSections.sortOrder, menu.sortOrder, menu.name);
}

export async function getMenuItem(id: string): Promise<MenuItemView | null> {
  await requireAccess("main");
  const parsedId = parseUuidOrNull(id);
  if (parsedId === null) return null;

  const [item] = await db.select(menuItemSelection).from(menu).where(eq(menu.id, parsedId));
  return item ?? null;
}

export async function getRecipeOptions(): Promise<RecipeOption[]> {
  return db.select({ id: recipes.id, name: recipes.name }).from(recipes).orderBy(recipes.name);
}

export async function getMenuSections(): Promise<(typeof menuSections.$inferSelect)[]> {
  await requireAccess("main");
  return db.select().from(menuSections).orderBy(menuSections.menuName, menuSections.sortOrder, menuSections.name);
}
