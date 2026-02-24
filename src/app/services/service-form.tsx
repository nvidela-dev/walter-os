"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createService, updateService } from "./actions";
import type { Servicio } from "@/db/schema";

export function ServiceForm({ service }: { service?: Servicio }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!service;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      nombre: formData.get("nombre") as string,
      descripcion: (formData.get("descripcion") as string) || null,
    };

    if (isEditing) await updateService(service.id, data);
    else await createService(data);
    router.push("/services");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="nombre" className="mb-2 block text-sm font-medium text-[#3d3530]">Nombre del Servicio</label>
        <input type="text" id="nombre" name="nombre" required defaultValue={service?.nombre} placeholder="Ej: Electricidad..."
          className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-4 text-[#3d3530] placeholder:text-[#c4a77d] focus:border-[#c4a77d] focus:outline-none" />
      </div>
      <div>
        <label htmlFor="descripcion" className="mb-2 block text-sm font-medium text-[#3d3530]">Descripción</label>
        <textarea id="descripcion" name="descripcion" rows={2} defaultValue={service?.descripcion ?? ""} placeholder="Opcional..."
          className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-4 text-[#3d3530] placeholder:text-[#c4a77d] focus:border-[#c4a77d] focus:outline-none" />
      </div>
      <button type="submit" disabled={isSubmitting}
        className="w-full rounded-xl bg-[#c4a77d] py-4 text-base font-medium text-white shadow-sm active:scale-[0.99] disabled:opacity-50">
        {isSubmitting ? "Guardando..." : isEditing ? "Guardar" : "Agregar Servicio"}
      </button>
    </form>
  );
}
