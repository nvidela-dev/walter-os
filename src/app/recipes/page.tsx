import Link from "next/link";
import { getRecipes } from "./actions";

export default async function RecipesPage() {
  const recipes = await getRecipes();

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl">←</Link>
          <h1 className="text-xl font-bold text-gray-800">Recipes</h1>
        </div>
        <Link href="/recipes/new" className="flex h-12 items-center gap-2 rounded-full bg-pink-500 px-5 text-lg font-medium text-white shadow-md active:scale-95">
          <span className="text-2xl">+</span><span>Add</span>
        </Link>
      </header>

      <main className="flex-1 p-4">
        {recipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 text-6xl">📖</div>
            <h2 className="mb-2 text-xl font-semibold text-gray-700">No recipes yet</h2>
            <p className="mb-6 text-gray-500">Add your recipes here</p>
            <Link href="/recipes/new" className="rounded-full bg-pink-500 px-6 py-3 text-lg font-medium text-white shadow-md active:scale-95">Add Recipe</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recipes.map((recipe) => (
              <Link key={recipe.id} href={`/recipes/${recipe.id}`} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm active:bg-gray-50">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-pink-100 text-2xl">📖</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">{recipe.nombre}</h3>
                  {recipe.descripcion && <p className="text-sm text-gray-500 line-clamp-1">{recipe.descripcion}</p>}
                </div>
                <div className="text-2xl text-gray-400">→</div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
