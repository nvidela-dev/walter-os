"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateProduct } from "../../../actions";

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
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultUnidadId =
    product.unidadId ??
    unidades.find((u) => u.codigo === "unidad")?.id ??
    unidades[0]?.id ??
    "";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      nombre: formData.get("nombre") as string,
      unidadId: formData.get("unidadId") as string,
      precio: formData.get("precio") as string,
    };

    await updateProduct(providerId, productId, data);
    router.push(`/providers/${providerId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="nombre" className="mb-2 block text-xs font-medium text-[#8b7355]">Nombre</label>
        <input
          type="text"
          id="nombre"
          name="nombre"
          required
          defaultValue={product.nombre}
          className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#3d3530] focus:border-[#c4a77d] focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="unidadId" className="mb-2 block text-xs font-medium text-[#8b7355]">Unidad</label>
        <select
          id="unidadId"
          name="unidadId"
          defaultValue={defaultUnidadId}
          className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#3d3530] focus:border-[#c4a77d] focus:outline-none"
        >
          {unidades.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nombre}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="precio" className="mb-2 block text-xs font-medium text-[#8b7355]">Precio ($)</label>
        <input
          type="number"
          id="precio"
          name="precio"
          step="0.01"
          required
          defaultValue={product.precio}
          className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#3d3530] focus:border-[#c4a77d] focus:outline-none"
        />
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
