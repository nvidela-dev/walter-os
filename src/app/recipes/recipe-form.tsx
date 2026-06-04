"use client";

import { useRouter } from "next/navigation";
import { type ReactElement, useState } from "react";

import { FormMessage } from "@/components/form-feedback";
import type { Receta } from "@/db/schema";
import { getFormString } from "@/lib/form";

import { createRecipe, updateRecipe } from "./actions";

export function RecipeForm({ recipe }: { recipe?: Receta }): ReactElement {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!recipe;

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const data = {
      nombre: getFormString(formData, "nombre"),
      descripcion: getFormString(formData, "descripcion") || null,
    };
    const result = isEditing ? await updateRecipe(recipe.id, data) : await createRecipe(data);
    if (!result.ok) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }
    router.push("/recipes");
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
      <FormMessage message={error} />
      <div><label className="mb-2 block text-sm font-medium text-[#3d3530]">Nombre de la Receta</label><input type="text" name="nombre" required defaultValue={recipe?.nombre} className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-4 text-[#3d3530] focus:border-[#c4a77d] focus:outline-none" /></div>
      <div><label className="mb-2 block text-sm font-medium text-[#3d3530]">Instrucciones</label><textarea name="descripcion" rows={5} defaultValue={recipe?.descripcion ?? ""} placeholder="Cómo preparar..." className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-4 text-[#3d3530] placeholder:text-[#c4a77d] focus:border-[#c4a77d] focus:outline-none" /></div>
      <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-[#c4a77d] py-4 text-base font-medium text-white shadow-sm active:scale-[0.99] disabled:opacity-50">{isSubmitting ? "..." : isEditing ? "Guardar" : "Agregar Receta"}</button>
    </form>
  );
}
