"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import type { ReactElement } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { FieldError, FormMessage } from "@/components/form-feedback";
import type { MenuItem } from "@/db/schema";

import { createMenuItem, updateMenuItem } from "./actions";
import { type MenuFormValues, menuItemInputSchema } from "./schema";

const inputClass =
  "w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-4 text-[#3d3530] placeholder:text-[#c4a77d] focus:border-[#c4a77d] focus:outline-none";

export function MenuForm({
  item,
  recipes,
}: {
  item?: MenuItem;
  recipes: { id: string; nombre: string }[];
}): ReactElement {
  const router = useRouter();
  const isEditing = item !== undefined;
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MenuFormValues, unknown, z.output<typeof menuItemInputSchema>>({
    resolver: zodResolver(menuItemInputSchema),
    defaultValues: {
      nombre: item?.nombre ?? "",
      descripcion: item?.descripcion ?? "",
      precioVenta: item?.precioVenta ?? "",
      recetaId: item?.recetaId ?? "",
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    const result = isEditing ? await updateMenuItem(item.id, data) : await createMenuItem(data);
    if (result.ok) {
      router.push("/menu");
    } else {
      setError("root", { message: result.error });
    }
  });

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-5">
      <FormMessage message={errors.root?.message ?? null} />
      <div>
        <label className="mb-2 block text-sm font-medium text-[#3d3530]">Nombre del Plato</label>
        <input type="text" {...register("nombre")} className={inputClass} />
        <FieldError message={errors.nombre?.message} />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-[#3d3530]">Precio de Venta ($)</label>
        <input type="number" step="0.01" {...register("precioVenta")} className={inputClass} />
        <FieldError message={errors.precioVenta?.message} />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-[#3d3530]">Receta Asociada</label>
        <select {...register("recetaId")} className={inputClass}>
          <option value="">Sin receta</option>
          {recipes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre}
            </option>
          ))}
        </select>
        <FieldError message={errors.recetaId?.message} />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-[#3d3530]">Descripción</label>
        <textarea
          rows={3}
          placeholder="Notas opcionales..."
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
        {isSubmitting ? "..." : isEditing ? "Guardar" : "Agregar Plato"}
      </button>
    </form>
  );
}
