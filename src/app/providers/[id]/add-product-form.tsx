"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type ReactElement, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { FieldError, FormMessage } from "@/components/form-feedback";

import { createProductForProvider } from "../actions";
import { addProductFormSchema,type AddProductFormValues } from "../schema";

interface UnidadOption {
  id: string;
  codigo: string;
  nombre: string;
}

const fieldClass =
  "w-full rounded-lg border-2 border-[#e8e0d4] px-3 py-3 text-sm text-[#3d3530] placeholder:text-[#c4a77d] focus:border-[#c4a77d] focus:outline-none";

export function AddProductForm({
  providerId,
  unidades,
}: {
  providerId: string;
  unidades: UnidadOption[];
}): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const defaultUnidadId =
    unidades.find((u) => u.codigo === "unidad")?.id ?? unidades[0]?.id ?? "";

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddProductFormValues, unknown, z.output<typeof addProductFormSchema>>({
    resolver: zodResolver(addProductFormSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      unidadId: defaultUnidadId,
      precio: "",
      cantidad: "1",
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    const result = await createProductForProvider(
      providerId,
      { nombre: data.nombre, descripcion: data.descripcion, unidadId: data.unidadId },
      data.precio,
      data.cantidad
    );
    if (result.ok) {
      reset();
      setIsOpen(false);
    } else {
      setError("root", { message: result.error });
    }
  });

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
        }}
        className="w-full rounded-xl border-2 border-dashed border-[#c4a77d] py-4 text-sm font-medium text-[#c4a77d] hover:bg-white"
      >
        + Agregar Producto
      </button>
    );
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-4 rounded-xl bg-white p-4">
      <FormMessage message={errors.root?.message ?? null} />
      <div>
        <input type="text" placeholder="Nombre del producto" {...register("nombre")} className={fieldClass} />
        <FieldError message={errors.nombre?.message} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <input
            type="number"
            step="0.01"
            placeholder="Cant."
            {...register("cantidad")}
            className={fieldClass}
          />
          <FieldError message={errors.cantidad?.message} />
        </div>
        <div>
          <select {...register("unidadId")} className={fieldClass}>
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </select>
          <FieldError message={errors.unidadId?.message} />
        </div>
        <div>
          <input type="number" step="0.01" placeholder="Precio" {...register("precio")} className={fieldClass} />
          <FieldError message={errors.precio?.message} />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
          }}
          className="flex-1 rounded-lg border-2 border-[#e8e0d4] py-3 text-sm font-medium text-[#8b7355]"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-lg bg-[#c4a77d] py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {isSubmitting ? "Agregando..." : "Agregar"}
        </button>
      </div>
    </form>
  );
}
