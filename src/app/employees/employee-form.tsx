"use client";

import { useRouter } from "next/navigation";
import { type ReactElement, useState } from "react";

import { FormMessage } from "@/components/form-feedback";
import type { Empleado } from "@/db/schema";
import { getFormString } from "@/lib/form";

import { createEmployee, updateEmployee } from "./actions";

export function EmployeeForm({ employee }: { employee?: Empleado }): ReactElement {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!employee;

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const data = {
      nombre: getFormString(formData, "nombre"),
      salarioMensual: getFormString(formData, "salarioMensual"),
      horasFijasSemanales: parseInt(getFormString(formData, "horasFijasSemanales"), 10),
    };
    const result = isEditing ? await updateEmployee(employee.id, data) : await createEmployee(data);
    if (!result.ok) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }
    router.push("/employees");
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
      <FormMessage message={error} />
      <div><label className="mb-2 block text-sm font-medium text-[#3d3530]">Nombre</label><input type="text" name="nombre" required defaultValue={employee?.nombre} className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-4 text-[#3d3530] focus:border-[#c4a77d] focus:outline-none" /></div>
      <div><label className="mb-2 block text-sm font-medium text-[#3d3530]">Salario Mensual ($)</label><input type="number" name="salarioMensual" step="0.01" required defaultValue={employee?.salarioMensual} className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-4 text-[#3d3530] focus:border-[#c4a77d] focus:outline-none" /></div>
      <div><label className="mb-2 block text-sm font-medium text-[#3d3530]">Horas Semanales</label><input type="number" name="horasFijasSemanales" required defaultValue={employee?.horasFijasSemanales ?? 40} className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-4 text-[#3d3530] focus:border-[#c4a77d] focus:outline-none" /></div>
      <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-[#c4a77d] py-4 text-base font-medium text-white shadow-sm active:scale-[0.99] disabled:opacity-50">{isSubmitting ? "..." : isEditing ? "Guardar" : "Agregar"}</button>
    </form>
  );
}
