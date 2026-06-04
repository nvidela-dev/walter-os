import { notFound } from "next/navigation";
import type { ReactElement } from "react";

import { DeleteButton } from "@/components/delete-button";
import { PageHeader } from "@/components/ui/page-header";
import { t } from "@/i18n";
import { deleteRecipe } from "@/lib/actions/recipes";
import { getRecipeWithIngredients } from "@/lib/queries/recipes";

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
      <PageHeader
        backHref="/recipes"
        title={recipe.name}
        actions={<DeleteButton id={recipe.id} name={recipe.name} deleteAction={deleteRecipe} redirectTo="/recipes" />}
      />
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
