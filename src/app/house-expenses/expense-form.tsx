"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createHouseExpense, updateHouseExpense } from "./actions";
import type { GastoHogar } from "@/db/schema";

const FREQUENCIES = [
  { value: "mensual", label: "Monthly" },
  { value: "bimestral", label: "Bimonthly" },
  { value: "trimestral", label: "Quarterly" },
  { value: "anual", label: "Yearly" },
];

export function ExpenseForm({ expense }: { expense?: GastoHogar }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!expense;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      nombre: formData.get("nombre") as string,
      descripcion: (formData.get("descripcion") as string) || null,
      monto: formData.get("monto") as string,
      frecuencia: formData.get("frecuencia") as string,
    };

    if (isEditing) await updateHouseExpense(expense.id, data);
    else await createHouseExpense(data);
    router.push("/house-expenses");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="nombre" className="mb-2 block text-lg font-medium text-gray-700">Expense Name *</label>
        <input type="text" id="nombre" name="nombre" required defaultValue={expense?.nombre} placeholder="e.g., Internet, Phone..."
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-4 text-lg focus:border-orange-500 focus:outline-none" />
      </div>

      <div>
        <label htmlFor="monto" className="mb-2 block text-lg font-medium text-gray-700">Amount ($) *</label>
        <input type="number" id="monto" name="monto" step="0.01" required defaultValue={expense?.monto}
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-4 text-lg focus:border-orange-500 focus:outline-none" />
      </div>

      <div>
        <label htmlFor="frecuencia" className="mb-2 block text-lg font-medium text-gray-700">Frequency *</label>
        <select id="frecuencia" name="frecuencia" required defaultValue={expense?.frecuencia ?? "mensual"}
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-4 text-lg focus:border-orange-500 focus:outline-none">
          {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="descripcion" className="mb-2 block text-lg font-medium text-gray-700">Description (optional)</label>
        <textarea id="descripcion" name="descripcion" rows={3} defaultValue={expense?.descripcion ?? ""}
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-4 text-lg focus:border-orange-500 focus:outline-none" />
      </div>

      <button type="submit" disabled={isSubmitting}
        className="w-full rounded-xl bg-orange-500 py-4 text-xl font-semibold text-white shadow-lg active:scale-[0.98] disabled:opacity-50">
        {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Add Expense"}
      </button>
    </form>
  );
}
