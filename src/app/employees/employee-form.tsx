"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createEmployee, updateEmployee } from "./actions";
import type { Empleado } from "@/db/schema";

export function EmployeeForm({ employee }: { employee?: Empleado }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!employee;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = { nombre: formData.get("nombre") as string, salarioMensual: formData.get("salarioMensual") as string, horasFijasSemanales: parseInt(formData.get("horasFijasSemanales") as string) };
    if (isEditing) await updateEmployee(employee.id, data);
    else await createEmployee(data);
    router.push("/employees");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div><label className="mb-2 block text-sm font-medium text-[#3d3530]">Name</label><input type="text" name="nombre" required defaultValue={employee?.nombre} className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-4 text-[#3d3530] focus:border-[#c4a77d] focus:outline-none" /></div>
      <div><label className="mb-2 block text-sm font-medium text-[#3d3530]">Monthly Salary ($)</label><input type="number" name="salarioMensual" step="0.01" required defaultValue={employee?.salarioMensual} className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-4 text-[#3d3530] focus:border-[#c4a77d] focus:outline-none" /></div>
      <div><label className="mb-2 block text-sm font-medium text-[#3d3530]">Weekly Hours</label><input type="number" name="horasFijasSemanales" required defaultValue={employee?.horasFijasSemanales ?? 40} className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-4 text-[#3d3530] focus:border-[#c4a77d] focus:outline-none" /></div>
      <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-[#c4a77d] py-4 text-base font-medium text-white shadow-sm active:scale-[0.99] disabled:opacity-50">{isSubmitting ? "..." : isEditing ? "Save" : "Add"}</button>
    </form>
  );
}
