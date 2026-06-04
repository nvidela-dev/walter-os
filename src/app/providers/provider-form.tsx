"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import type { ReactElement } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { z } from "zod";

import { FieldError, FormMessage } from "@/components/form-feedback";
import type { Proveedor } from "@/db/schema";

import { createProvider, updateProvider } from "./actions";
import { type ProviderFormValues, providerInputSchema } from "./schema";

const DAYS = [
  { key: "L", label: "Lunes" },
  { key: "M", label: "Martes" },
  { key: "X", label: "Miércoles" },
  { key: "J", label: "Jueves" },
  { key: "V", label: "Viernes" },
  { key: "S", label: "Sábado" },
  { key: "D", label: "Domingo" },
];

const inputClass =
  "w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#3d3530] placeholder:text-[#c4a77d] focus:border-[#c4a77d] focus:outline-none";

export function ProviderForm({ provider }: { provider?: Proveedor }): ReactElement {
  const router = useRouter();
  const isEditing = provider !== undefined;
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ProviderFormValues, unknown, z.output<typeof providerInputSchema>>({
    resolver: zodResolver(providerInputSchema),
    defaultValues: {
      nombre: provider?.nombre ?? "",
      descripcion: provider?.descripcion ?? "",
      tipo: provider?.tipo ?? "producto",
      dias: provider?.dias ?? "",
    },
  });

  const tipo = useWatch({ control, name: "tipo" });
  const diasValue = useWatch({ control, name: "dias" }) ?? "";
  const selectedDays = diasValue === "" ? [] : diasValue.split(",");

  function toggleDay(day: string): void {
    const next = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day];
    setValue("dias", next.join(","));
  }

  const onSubmit = handleSubmit(async (data) => {
    const result = isEditing ? await updateProvider(provider.id, data) : await createProvider(data);
    if (result.ok) {
      router.push(isEditing ? `/providers/${provider.id}` : `/providers/${result.data.id}`);
    } else {
      setError("root", { message: result.error });
    }
  });

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-5">
      <FormMessage message={errors.root?.message ?? null} />
      <div>
        <label className="mb-2 block text-xs font-medium text-[#8b7355]">Tipo</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setValue("tipo", "producto");
            }}
            className={`rounded-xl py-3 text-sm font-medium transition-colors ${
              tipo === "producto" ? "bg-[#c4a77d] text-white" : "bg-[#e8e0d4] text-[#8b7355]"
            }`}
          >
            Productos
          </button>
          <button
            type="button"
            onClick={() => {
              setValue("tipo", "servicio");
            }}
            className={`rounded-xl py-3 text-sm font-medium transition-colors ${
              tipo === "servicio" ? "bg-[#c4a77d] text-white" : "bg-[#e8e0d4] text-[#8b7355]"
            }`}
          >
            Servicios
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="nombre" className="mb-2 block text-xs font-medium text-[#8b7355]">
          Nombre del Proveedor
        </label>
        <input
          type="text"
          id="nombre"
          placeholder="Ingresa el nombre..."
          {...register("nombre")}
          className={inputClass}
        />
        <FieldError message={errors.nombre?.message} />
      </div>

      <div>
        <label htmlFor="descripcion" className="mb-2 block text-xs font-medium text-[#8b7355]">
          Descripción
        </label>
        <input
          type="text"
          id="descripcion"
          placeholder="Descripción opcional..."
          {...register("descripcion")}
          className={inputClass}
        />
        <FieldError message={errors.descripcion?.message} />
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-[#8b7355]">Días de visita</label>
        <div className="flex gap-2">
          {DAYS.map((day) => (
            <button
              key={day.key}
              type="button"
              onClick={() => {
                toggleDay(day.key);
              }}
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
        <FieldError message={errors.dias?.message} />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-[#c4a77d] py-4 text-base font-medium text-white shadow-sm active:scale-[0.99] disabled:opacity-50"
      >
        {isSubmitting ? "Guardando..." : isEditing ? "Guardar Cambios" : "Crear Proveedor"}
      </button>
    </form>
  );
}
