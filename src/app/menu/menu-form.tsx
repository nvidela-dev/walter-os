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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium text-[#3d3530]">Item Name</label>
        <input type="text" name="nombre" required defaultValue={item?.nombre}
          className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-4 text-[#3d3530] focus:border-[#c4a77d] focus:outline-none" />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-[#3d3530]">Sale Price ($)</label>
        <input type="number" name="precioVenta" step="0.01" required defaultValue={item?.precioVenta}
          className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-4 text-[#3d3530] focus:border-[#c4a77d] focus:outline-none" />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-[#3d3530]">Linked Recipe</label>
        <select name="recetaId" defaultValue={item?.recetaId ?? ""}
          className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-4 text-[#3d3530] focus:border-[#c4a77d] focus:outline-none">
          <option value="">No recipe</option>
          {recipes.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-[#3d3530]">Description</label>
        <textarea name="descripcion" rows={3} defaultValue={item?.descripcion ?? ""} placeholder="Optional notes..."
          className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-4 text-[#3d3530] placeholder:text-[#c4a77d] focus:border-[#c4a77d] focus:outline-none" />
      </div>

      <button type="submit" disabled={isSubmitting}
        className="w-full rounded-xl bg-[#c4a77d] py-4 text-base font-medium text-white shadow-sm active:scale-[0.99] disabled:opacity-50">
        {isSubmitting ? "..." : isEditing ? "Save" : "Add Item"}
      </button>
    </form>
  );
}
