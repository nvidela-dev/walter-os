"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import type { ReactElement } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { FieldError, FormMessage } from "@/components/form-feedback";

import { updateProduct } from "../../../actions";
import { productEditFormSchema,type ProductEditFormValues } from "../../../schema";

interface Product {
  id: string;
  nombre: string;
  unidadId: string | null;
  precio: string;
  descripcion: string | null;
}

interface UnidadOption {
  id: string;
  codigo: string;
  nombre: string;
}

const inputClass =
  "w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#3d3530] focus:border-[#c4a77d] focus:outline-none";

export function ProductEditForm({
  providerId,
  productId,
  product,
  unidades,
}: {
  providerId: string;
  productId: string;
  product: Product;
  unidades: UnidadOption[];
}): ReactElement {
  const router = useRouter();
  const defaultUnidadId =
    product.unidadId ?? unidades.find((u) => u.codigo === "unidad")?.id ?? unidades[0]?.id ?? "";

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductEditFormValues, unknown, z.output<typeof productEditFormSchema>>({
    resolver: zodResolver(productEditFormSchema),
    defaultValues: {
      nombre: product.nombre,
      unidadId: defaultUnidadId,
      precio: product.precio,
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    const result = await updateProduct(providerId, productId, data);
    if (result.ok) {
      router.push(`/providers/${providerId}`);
    } else {
      setError("root", { message: result.error });
    }
  });

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-5">
      <FormMessage message={errors.root?.message ?? null} />
      <div>
        <label htmlFor="nombre" className="mb-2 block text-xs font-medium text-[#8b7355]">
          Nombre
        </label>
        <input type="text" id="nombre" {...register("nombre")} className={inputClass} />
        <FieldError message={errors.nombre?.message} />
      </div>

      <div>
        <label htmlFor="unidadId" className="mb-2 block text-xs font-medium text-[#8b7355]">
          Unidad
        </label>
        <select id="unidadId" {...register("unidadId")} className={inputClass}>
          {unidades.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nombre}
            </option>
          ))}
        </select>
        <FieldError message={errors.unidadId?.message} />
      </div>

      <div>
        <label htmlFor="precio" className="mb-2 block text-xs font-medium text-[#8b7355]">
          Precio ($)
        </label>
        <input type="number" id="precio" step="0.01" {...register("precio")} className={inputClass} />
        <FieldError message={errors.precio?.message} />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-[#c4a77d] py-4 text-base font-medium text-white shadow-sm active:scale-[0.99] disabled:opacity-50"
      >
        {isSubmitting ? "Guardando..." : "Guardar Cambios"}
      </button>
    </form>
  );
}
