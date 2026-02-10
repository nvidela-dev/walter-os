"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createServicePayment, updateServicePayment } from "./actions";
import type { Servicio } from "@/db/schema";

type PaymentData = {
  id: string;
  servicioId: string;
  monto: string;
  fecha: string;
  notas: string | null;
};

export function PaymentForm({
  services,
  payment
}: {
  services: Servicio[];
  payment?: PaymentData;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!payment;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      servicioId: formData.get("servicioId") as string,
      monto: formData.get("monto") as string,
      fecha: formData.get("fecha") as string,
      notas: (formData.get("notas") as string) || null,
    };

    if (isEditing) await updateServicePayment(payment.id, data);
    else await createServicePayment(data);
    router.push("/service-payments");
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="servicioId" className="mb-2 block text-sm font-medium text-[#3d3530]">Servicio</label>
        <select
          id="servicioId"
          name="servicioId"
          required
          defaultValue={payment?.servicioId ?? ""}
          className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-4 text-[#3d3530] focus:border-[#c4a77d] focus:outline-none"
        >
          <option value="" disabled>Selecciona un servicio</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>{s.nombre}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="monto" className="mb-2 block text-sm font-medium text-[#3d3530]">Monto ($)</label>
        <input
          type="number"
          id="monto"
          name="monto"
          step="0.01"
          required
          defaultValue={payment?.monto}
          className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-4 text-[#3d3530] focus:border-[#c4a77d] focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="fecha" className="mb-2 block text-sm font-medium text-[#3d3530]">Fecha</label>
        <input
          type="date"
          id="fecha"
          name="fecha"
          required
          defaultValue={payment?.fecha ?? today}
          className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-4 text-[#3d3530] focus:border-[#c4a77d] focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="notas" className="mb-2 block text-sm font-medium text-[#3d3530]">Notas</label>
        <textarea
          id="notas"
          name="notas"
          rows={2}
          defaultValue={payment?.notas ?? ""}
          placeholder="Opcional..."
          className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-4 text-[#3d3530] placeholder:text-[#c4a77d] focus:border-[#c4a77d] focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-[#c4a77d] py-4 text-base font-medium text-white shadow-sm active:scale-[0.99] disabled:opacity-50"
      >
        {isSubmitting ? "Guardando..." : isEditing ? "Guardar" : "Registrar Pago"}
      </button>
    </form>
  );
}
