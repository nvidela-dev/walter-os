"use client";

import { useState } from "react";
import { createProductForProvider } from "../actions";

const UNITS = [
  { value: "unidad", label: "Unit" },
  { value: "kg", label: "Kg" },
  { value: "g", label: "Gram" },
  { value: "litro", label: "Liter" },
  { value: "ml", label: "ml" },
  { value: "docena", label: "Dozen" },
];

export function AddProductForm({ providerId }: { providerId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    await createProductForProvider(
      providerId,
      {
        nombre: formData.get("nombre") as string,
        unidad: formData.get("unidad") as string,
        descripcion: (formData.get("descripcion") as string) || null,
      },
      formData.get("precio") as string
    );

    setIsSubmitting(false);
    setIsOpen(false);
    e.currentTarget.reset();
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full rounded-xl border-2 border-dashed border-[#c4a77d] py-4 text-sm font-medium text-[#c4a77d] hover:bg-white"
      >
        + Add Product
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <input
            type="text"
            name="nombre"
            required
            placeholder="Product name"
            className="w-full rounded-lg border-2 border-[#e8e0d4] px-3 py-3 text-sm text-[#3d3530] placeholder:text-[#c4a77d] focus:border-[#c4a77d] focus:outline-none"
          />
        </div>
        <div>
          <input
            type="number"
            name="precio"
            step="0.01"
            required
            placeholder="Price"
            className="w-full rounded-lg border-2 border-[#e8e0d4] px-3 py-3 text-sm text-[#3d3530] placeholder:text-[#c4a77d] focus:border-[#c4a77d] focus:outline-none"
          />
        </div>
        <div>
          <select
            name="unidad"
            defaultValue="unidad"
            className="w-full rounded-lg border-2 border-[#e8e0d4] px-3 py-3 text-sm text-[#3d3530] focus:border-[#c4a77d] focus:outline-none"
          >
            {UNITS.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="flex-1 rounded-lg border-2 border-[#e8e0d4] py-3 text-sm font-medium text-[#8b7355]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-lg bg-[#c4a77d] py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {isSubmitting ? "Adding..." : "Add"}
        </button>
      </div>
    </form>
  );
}
