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
    const data = {
      nombre: formData.get("nombre") as string,
      salarioMensual: formData.get("salarioMensual") as string,
      horasFijasSemanales: parseInt(formData.get("horasFijasSemanales") as string),
    };

    if (isEditing) await updateEmployee(employee.id, data);
    else await createEmployee(data);
    router.push("/employees");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="nombre" className="mb-2 block text-lg font-medium text-gray-700">Employee Name *</label>
        <input type="text" id="nombre" name="nombre" required defaultValue={employee?.nombre}
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-4 text-lg focus:border-purple-500 focus:outline-none" />
      </div>

      <div>
        <label htmlFor="salarioMensual" className="mb-2 block text-lg font-medium text-gray-700">Monthly Salary ($) *</label>
        <input type="number" id="salarioMensual" name="salarioMensual" step="0.01" required defaultValue={employee?.salarioMensual}
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-4 text-lg focus:border-purple-500 focus:outline-none" />
      </div>

      <div>
        <label htmlFor="horasFijasSemanales" className="mb-2 block text-lg font-medium text-gray-700">Weekly Hours *</label>
        <input type="number" id="horasFijasSemanales" name="horasFijasSemanales" required defaultValue={employee?.horasFijasSemanales ?? 40}
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-4 text-lg focus:border-purple-500 focus:outline-none" />
      </div>

      <button type="submit" disabled={isSubmitting}
        className="w-full rounded-xl bg-purple-500 py-4 text-xl font-semibold text-white shadow-lg active:scale-[0.98] disabled:opacity-50">
        {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Add Employee"}
      </button>
    </form>
  );
}
