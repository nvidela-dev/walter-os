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
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/recipes" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl">←</Link>
          <h1 className="text-xl font-bold text-gray-800">Edit Recipe</h1>
        </div>
        <DeleteButton id={recipe.id} name={recipe.nombre} deleteAction={deleteRecipe} redirectTo="/recipes" />
      </header>
      <main className="flex-1 space-y-4 p-4">
        <div className="rounded-2xl bg-white p-6 shadow-sm"><RecipeForm recipe={recipe} /></div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-800">Ingredients</h2>
          {recipe.ingredientes.length === 0 ? (
            <p className="text-gray-500">No ingredients added. Feature coming soon.</p>
          ) : (
            <div className="space-y-2">
              {recipe.ingredientes.map((i) => (
                <div key={i.productoId} className="flex justify-between rounded-xl bg-gray-50 p-3">
                  <span>{i.nombre}</span>
                  <span>{i.cantidad} {i.unidad}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
