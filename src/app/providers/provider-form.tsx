"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createProvider, updateProvider } from "./actions";
import type { Proveedor } from "@/db/schema";

const DAYS = [
  { key: "L", label: "Lunes" },
  { key: "M", label: "Martes" },
  { key: "X", label: "Miércoles" },
  { key: "J", label: "Jueves" },
  { key: "V", label: "Viernes" },
  { key: "S", label: "Sábado" },
  { key: "D", label: "Domingo" },
];

export function ProviderForm({ provider }: { provider?: Proveedor }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>(
    provider?.dias ? provider.dias.split(",") : []
  );
  const isEditing = !!provider;

  function toggleDay(day: string) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      nombre: formData.get("nombre") as string,
      descripcion: (formData.get("descripcion") as string) || null,
      dias: selectedDays.length > 0 ? selectedDays.join(",") : null,
    };

    if (isEditing) {
      await updateProvider(provider.id, data);
      router.push(`/providers/${provider.id}`);
    } else {
      const newProvider = await createProvider(data);
      router.push(`/providers/${newProvider.id}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="nombre" className="mb-2 block text-xs font-medium text-[#8b7355]">Nombre del Proveedor</label>
        <input type="text" id="nombre" name="nombre" required defaultValue={provider?.nombre}
          placeholder="Ingresa el nombre..."
          className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#3d3530] placeholder:text-[#c4a77d] focus:border-[#c4a77d] focus:outline-none" />
      </div>

      <div>
        <label htmlFor="descripcion" className="mb-2 block text-xs font-medium text-[#8b7355]">Descripción</label>
        <input type="text" id="descripcion" name="descripcion" defaultValue={provider?.descripcion ?? ""}
          placeholder="Descripción opcional..."
          className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#3d3530] placeholder:text-[#c4a77d] focus:border-[#c4a77d] focus:outline-none" />
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-[#8b7355]">Días de visita</label>
        <div className="flex gap-2">
          {DAYS.map((day) => (
            <button
              key={day.key}
              type="button"
              onClick={() => toggleDay(day.key)}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                selectedDays.includes(day.key)
                  ? "bg-amber-500 text-white"
                  : "bg-[#e8e0d4] text-[#8b7355]"
              }`}
              title={day.label}
            >
              {day.key}
            </button>
          ))}
        </div>
      </div>

      <button type="submit" disabled={isSubmitting}
        className="w-full rounded-xl bg-[#c4a77d] py-4 text-base font-medium text-white shadow-sm active:scale-[0.99] disabled:opacity-50">
        {isSubmitting ? "Guardando..." : isEditing ? "Guardar Cambios" : "Crear Proveedor"}
      </button>
    </form>
  );
}
