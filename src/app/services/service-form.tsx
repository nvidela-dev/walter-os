"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createService, updateService } from "./actions";
import type { Servicio } from "@/db/schema";

const FREQUENCIES = [
  { value: "mensual", label: "Mensual" },
  { value: "bimestral", label: "Bimestral" },
  { value: "trimestral", label: "Trimestral" },
  { value: "anual", label: "Anual" },
];

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
      montoFijo: formData.get("montoFijo") as string,
      frecuencia: formData.get("frecuencia") as string,
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
        <label htmlFor="montoFijo" className="mb-2 block text-sm font-medium text-[#3d3530]">Monto ($)</label>
        <input type="number" id="montoFijo" name="montoFijo" step="0.01" required defaultValue={service?.montoFijo}
          className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-4 text-[#3d3530] focus:border-[#c4a77d] focus:outline-none" />
      </div>
      <div>
        <label htmlFor="frecuencia" className="mb-2 block text-sm font-medium text-[#3d3530]">Frecuencia</label>
        <select id="frecuencia" name="frecuencia" required defaultValue={service?.frecuencia ?? "mensual"}
          className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-4 text-[#3d3530] focus:border-[#c4a77d] focus:outline-none">
          {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="descripcion" className="mb-2 block text-sm font-medium text-[#3d3530]">Notas</label>
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
