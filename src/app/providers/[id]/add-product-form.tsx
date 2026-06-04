"use client";

import { useState } from "react";
import { FormMessage } from "@/components/form-feedback";
import { createProductForProvider } from "../actions";

interface UnidadOption {
  id: string;
  codigo: string;
  nombre: string;
}

export function AddProductForm({
  providerId,
  unidades,
}: {
  providerId: string;
  unidades: UnidadOption[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultUnidadId =
    unidades.find((u) => u.codigo === "unidad")?.id ?? unidades[0]?.id ?? "";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createProductForProvider(
      providerId,
      {
        nombre: formData.get("nombre") as string,
        unidadId: formData.get("unidadId") as string,
        descripcion: (formData.get("descripcion") as string) || null,
      },
      formData.get("precio") as string,
      formData.get("cantidad") as string
    );

    setIsSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setIsOpen(false);
    e.currentTarget.reset();
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full rounded-xl border-2 border-dashed border-[#c4a77d] py-4 text-sm font-medium text-[#c4a77d] hover:bg-white"
      >
        + Agregar Producto
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-4">
      <FormMessage message={error} />
      <div>
        <input
          type="text"
          name="nombre"
          required
          placeholder="Nombre del producto"
          className="w-full rounded-lg border-2 border-[#e8e0d4] px-3 py-3 text-sm text-[#3d3530] placeholder:text-[#c4a77d] focus:border-[#c4a77d] focus:outline-none"
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <input
            type="number"
            name="cantidad"
            step="0.01"
            required
            defaultValue="1"
            placeholder="Cant."
            className="w-full rounded-lg border-2 border-[#e8e0d4] px-3 py-3 text-sm text-[#3d3530] placeholder:text-[#c4a77d] focus:border-[#c4a77d] focus:outline-none"
          />
        </div>
        <div>
          <select
            name="unidadId"
            defaultValue={defaultUnidadId}
            className="w-full rounded-lg border-2 border-[#e8e0d4] px-3 py-3 text-sm text-[#3d3530] focus:border-[#c4a77d] focus:outline-none"
          >
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <input
            type="number"
            name="precio"
            step="0.01"
            required
            placeholder="Precio"
            className="w-full rounded-lg border-2 border-[#e8e0d4] px-3 py-3 text-sm text-[#3d3530] placeholder:text-[#c4a77d] focus:border-[#c4a77d] focus:outline-none"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
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
