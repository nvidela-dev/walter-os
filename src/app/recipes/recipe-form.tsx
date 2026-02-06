"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createRecipe, updateRecipe } from "./actions";
import type { Receta } from "@/db/schema";

export function RecipeForm({ recipe }: { recipe?: Receta }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!recipe;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      nombre: formData.get("nombre") as string,
      descripcion: (formData.get("descripcion") as string) || null,
    };

    if (isEditing) await updateRecipe(recipe.id, data);
    else await createRecipe(data);
    router.push("/recipes");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="nombre" className="mb-2 block text-lg font-medium text-gray-700">Recipe Name *</label>
        <input type="text" id="nombre" name="nombre" required defaultValue={recipe?.nombre}
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-4 text-lg focus:border-pink-500 focus:outline-none" />
      </div>

      <div>
        <label htmlFor="descripcion" className="mb-2 block text-lg font-medium text-gray-700">Description / Instructions</label>
        <textarea id="descripcion" name="descripcion" rows={5} defaultValue={recipe?.descripcion ?? ""}
          placeholder="How to prepare this recipe..."
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-4 text-lg focus:border-pink-500 focus:outline-none" />
      </div>

      <button type="submit" disabled={isSubmitting}
        className="w-full rounded-xl bg-pink-500 py-4 text-xl font-semibold text-white shadow-lg active:scale-[0.98] disabled:opacity-50">
        {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Add Recipe"}
      </button>
    </form>
  );
}
