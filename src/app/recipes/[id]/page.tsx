import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecipeWithIngredients, deleteRecipe } from "../actions";
import { RecipeForm } from "../recipe-form";
import { DeleteButton } from "@/app/components/delete-button";

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = await getRecipeWithIngredients(id);
  if (!recipe) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-[#faf8f5]">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-[#faf8f5]/90 px-6 py-5 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Link href="/recipes" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f0e8] text-lg text-[#8b7355]">←</Link>
          <h1 className="text-xl font-light text-[#3d3530]">{recipe.nombre}</h1>
        </div>
        <DeleteButton id={recipe.id} name={recipe.nombre} deleteAction={deleteRecipe} redirectTo="/recipes" />
      </header>
      <main className="flex-1 space-y-4 px-6 py-4">
        <div className="rounded-2xl bg-[#f5f0e8] p-6"><RecipeForm recipe={recipe} /></div>
        <div className="rounded-2xl bg-[#f5f0e8] p-6">
          <h2 className="mb-4 text-lg font-medium text-[#3d3530]">Ingredients</h2>
          {recipe.ingredientes.length === 0 ? (
            <p className="text-[#8b7355]">No ingredients added yet.</p>
          ) : (
            <div className="space-y-2">
              {recipe.ingredientes.map((i) => (
                <div key={i.productoId} className="flex justify-between rounded-xl bg-[#e8e0d4] p-4">
                  <span className="text-[#3d3530]">{i.nombre}</span>
                  <span className="text-[#8b7355]">{i.cantidad} {i.unidad}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
