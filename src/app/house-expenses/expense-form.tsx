"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createHouseExpense, updateHouseExpense } from "./actions";
import type { GastoHogar } from "@/db/schema";

const FREQUENCIES = [{ value: "mensual", label: "Monthly" }, { value: "bimestral", label: "Bimonthly" }, { value: "trimestral", label: "Quarterly" }, { value: "anual", label: "Yearly" }];

export function ExpenseForm({ expense }: { expense?: GastoHogar }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!expense;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = { nombre: formData.get("nombre") as string, descripcion: (formData.get("descripcion") as string) || null, monto: formData.get("monto") as string, frecuencia: formData.get("frecuencia") as string };
    if (isEditing) await updateHouseExpense(expense.id, data);
    else await createHouseExpense(data);
    router.push("/house-expenses");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div><label className="mb-2 block text-sm font-medium text-[#3d3530]">Name</label><input type="text" name="nombre" required defaultValue={expense?.nombre} className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-4 text-[#3d3530] focus:border-[#c4a77d] focus:outline-none" /></div>
      <div><label className="mb-2 block text-sm font-medium text-[#3d3530]">Amount ($)</label><input type="number" name="monto" step="0.01" required defaultValue={expense?.monto} className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-4 text-[#3d3530] focus:border-[#c4a77d] focus:outline-none" /></div>
      <div><label className="mb-2 block text-sm font-medium text-[#3d3530]">Frequency</label><select name="frecuencia" defaultValue={expense?.frecuencia ?? "mensual"} className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-4 text-[#3d3530] focus:border-[#c4a77d] focus:outline-none">{FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}</select></div>
      <div><label className="mb-2 block text-sm font-medium text-[#3d3530]">Notes</label><textarea name="descripcion" rows={2} defaultValue={expense?.descripcion ?? ""} className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-4 text-[#3d3530] focus:border-[#c4a77d] focus:outline-none" /></div>
      <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-[#c4a77d] py-4 text-base font-medium text-white shadow-sm active:scale-[0.99] disabled:opacity-50">{isSubmitting ? "..." : isEditing ? "Save" : "Add"}</button>
    </form>
  );
}
