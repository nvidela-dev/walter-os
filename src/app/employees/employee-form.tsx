"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import type { ReactElement } from "react";
import { useForm } from "react-hook-form";

import { FieldError, FormMessage } from "@/components/form-feedback";
import type { Empleado } from "@/db/schema";

import { createEmployee, updateEmployee } from "./actions";
import { type EmployeeInput, employeeInputSchema } from "./schema";

const inputClass =
  "w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-4 text-[#3d3530] focus:border-[#c4a77d] focus:outline-none";

export function EmployeeForm({ employee }: { employee?: Empleado }): ReactElement {
  const router = useRouter();
  const isEditing = employee !== undefined;
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeInput>({
    resolver: zodResolver(employeeInputSchema),
    defaultValues: {
      nombre: employee?.nombre ?? "",
      salarioMensual: employee?.salarioMensual ?? "",
      horasFijasSemanales: employee?.horasFijasSemanales ?? 40,
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    const result = isEditing
      ? await updateEmployee(employee.id, data)
      : await createEmployee(data);
    if (result.ok) {
      router.push("/employees");
    } else {
      setError("root", { message: result.error });
    }
  });

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-5">
      <FormMessage message={errors.root?.message ?? null} />
      <div>
        <label className="mb-2 block text-sm font-medium text-[#3d3530]">Nombre</label>
        <input type="text" {...register("nombre")} className={inputClass} />
        <FieldError message={errors.nombre?.message} />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-[#3d3530]">Salario Mensual ($)</label>
        <input type="number" step="0.01" {...register("salarioMensual")} className={inputClass} />
        <FieldError message={errors.salarioMensual?.message} />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-[#3d3530]">Horas Semanales</label>
        <input
          type="number"
          {...register("horasFijasSemanales", { valueAsNumber: true })}
          className={inputClass}
        />
        <FieldError message={errors.horasFijasSemanales?.message} />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-[#c4a77d] py-4 text-base font-medium text-white shadow-sm active:scale-[0.99] disabled:opacity-50"
      >
        {isSubmitting ? "..." : isEditing ? "Guardar" : "Agregar"}
      </button>
    </form>
  );
}
