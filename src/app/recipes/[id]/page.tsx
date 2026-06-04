import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";

import { DeleteButton } from "@/components/delete-button";
import { t } from "@/i18n";

import { deleteRecipe, getRecipeWithIngredients } from "../actions";
import { RecipeForm } from "../recipe-form";

export const dynamic = "force-dynamic";

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<ReactElement> {
  const { id } = await params;
  const recipe = await getRecipeWithIngredients(id);
  if (!recipe) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-[#faf8f5]">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-[#faf8f5]/90 px-6 py-5 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Link href="/recipes" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f0e8] text-lg text-[#8b7355]">←</Link>
          <h1 className="text-xl font-light text-[#3d3530]">{recipe.name}</h1>
        </div>
        <DeleteButton id={recipe.id} name={recipe.name} deleteAction={deleteRecipe} redirectTo="/recipes" />
      </header>
      <main className="flex-1 space-y-4 px-6 py-4">
        <div className="rounded-2xl bg-[#f5f0e8] p-6"><RecipeForm recipe={recipe} /></div>
        <div className="rounded-2xl bg-[#f5f0e8] p-6">
          <h2 className="mb-4 text-lg font-medium text-[#3d3530]">{t.recipes.ingredients}</h2>
          {recipe.ingredients.length === 0 ? (
            <p className="text-[#8b7355]">{t.recipes.noIngredients}</p>
          ) : (
            <div className="space-y-2">
              {recipe.ingredients.map((ingredient) => (
                <div key={ingredient.productId} className="flex justify-between rounded-xl bg-[#e8e0d4] p-4">
                  <span className="text-[#3d3530]">{ingredient.name}</span>
                  <span className="text-[#8b7355]">{ingredient.quantity} {ingredient.unit}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
