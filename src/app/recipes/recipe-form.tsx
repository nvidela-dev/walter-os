"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import type { ReactElement } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { FieldError, FormMessage } from "@/components/form-feedback";
import type { Receta } from "@/db/schema";

import { createRecipe, updateRecipe } from "./actions";
import { type RecipeFormValues, recipeInputSchema } from "./schema";

const inputClass =
  "w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-4 text-[#3d3530] placeholder:text-[#c4a77d] focus:border-[#c4a77d] focus:outline-none";

export function RecipeForm({ recipe }: { recipe?: Receta }): ReactElement {
  const router = useRouter();
  const isEditing = recipe !== undefined;
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RecipeFormValues, unknown, z.output<typeof recipeInputSchema>>({
    resolver: zodResolver(recipeInputSchema),
    defaultValues: {
      nombre: recipe?.nombre ?? "",
      descripcion: recipe?.descripcion ?? "",
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    const result = isEditing ? await updateRecipe(recipe.id, data) : await createRecipe(data);
    if (result.ok) {
      router.push("/recipes");
    } else {
      setError("root", { message: result.error });
    }
  });

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-5">
      <FormMessage message={errors.root?.message ?? null} />
      <div>
        <label className="mb-2 block text-sm font-medium text-[#3d3530]">Nombre de la Receta</label>
        <input type="text" {...register("nombre")} className={inputClass} />
        <FieldError message={errors.nombre?.message} />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-[#3d3530]">Instrucciones</label>
        <textarea
          rows={5}
          placeholder="Cómo preparar..."
          {...register("descripcion")}
          className={inputClass}
        />
        <FieldError message={errors.descripcion?.message} />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-[#c4a77d] py-4 text-base font-medium text-white shadow-sm active:scale-[0.99] disabled:opacity-50"
      >
        {isSubmitting ? "..." : isEditing ? "Guardar" : "Agregar Receta"}
      </button>
    </form>
  );
}
