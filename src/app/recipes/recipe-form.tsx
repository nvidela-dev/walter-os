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
    const data = { nombre: formData.get("nombre") as string, descripcion: (formData.get("descripcion") as string) || null };
    if (isEditing) await updateRecipe(recipe.id, data);
    else await createRecipe(data);
    router.push("/recipes");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div><label className="mb-2 block text-sm font-medium text-[#3d3530]">Recipe Name</label><input type="text" name="nombre" required defaultValue={recipe?.nombre} className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-4 text-[#3d3530] focus:border-[#c4a77d] focus:outline-none" /></div>
      <div><label className="mb-2 block text-sm font-medium text-[#3d3530]">Instructions</label><textarea name="descripcion" rows={5} defaultValue={recipe?.descripcion ?? ""} placeholder="How to prepare..." className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-4 text-[#3d3530] placeholder:text-[#c4a77d] focus:border-[#c4a77d] focus:outline-none" /></div>
      <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-[#c4a77d] py-4 text-base font-medium text-white shadow-sm active:scale-[0.99] disabled:opacity-50">{isSubmitting ? "..." : isEditing ? "Save" : "Add Recipe"}</button>
    </form>
  );
}
