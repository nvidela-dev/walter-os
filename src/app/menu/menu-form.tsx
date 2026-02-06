"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createMenuItem, updateMenuItem } from "./actions";
import type { MenuItem } from "@/db/schema";

export function MenuForm({ item, recipes }: { item?: MenuItem; recipes: { id: string; nombre: string }[] }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!item;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const recetaId = formData.get("recetaId") as string;
    const data = {
      nombre: formData.get("nombre") as string,
      descripcion: (formData.get("descripcion") as string) || null,
      precioVenta: formData.get("precioVenta") as string,
      recetaId: recetaId || null,
    };

    if (isEditing) await updateMenuItem(item.id, data);
    else await createMenuItem(data);
    router.push("/menu");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="nombre" className="mb-2 block text-lg font-medium text-gray-700">Item Name *</label>
        <input type="text" id="nombre" name="nombre" required defaultValue={item?.nombre}
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-4 text-lg focus:border-red-500 focus:outline-none" />
      </div>

      <div>
        <label htmlFor="precioVenta" className="mb-2 block text-lg font-medium text-gray-700">Sale Price ($) *</label>
        <input type="number" id="precioVenta" name="precioVenta" step="0.01" required defaultValue={item?.precioVenta}
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-4 text-lg focus:border-red-500 focus:outline-none" />
      </div>

      <div>
        <label htmlFor="recetaId" className="mb-2 block text-lg font-medium text-gray-700">Linked Recipe (optional)</label>
        <select id="recetaId" name="recetaId" defaultValue={item?.recetaId ?? ""}
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-4 text-lg focus:border-red-500 focus:outline-none">
          <option value="">No recipe</option>
          {recipes.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="descripcion" className="mb-2 block text-lg font-medium text-gray-700">Description</label>
        <textarea id="descripcion" name="descripcion" rows={3} defaultValue={item?.descripcion ?? ""}
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-4 text-lg focus:border-red-500 focus:outline-none" />
      </div>

      <button type="submit" disabled={isSubmitting}
        className="w-full rounded-xl bg-red-500 py-4 text-xl font-semibold text-white shadow-lg active:scale-[0.98] disabled:opacity-50">
        {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Add Item"}
      </button>
    </form>
  );
}
