"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type ReactElement, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { FieldError, FormMessage } from "@/components/form-feedback";

import { updateProviderDebt } from "../actions";
import { type DebtFormValues, debtInputSchema } from "../schema";

export function DebtForm({
  providerId,
  currentDebt,
}: {
  providerId: string;
  currentDebt: string;
}): ReactElement {
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DebtFormValues, unknown, z.output<typeof debtInputSchema>>({
    resolver: zodResolver(debtInputSchema),
    defaultValues: { deuda: currentDebt },
  });

  const onSubmit = handleSubmit(async (data) => {
    setSaved(false);
    const result = await updateProviderDebt(providerId, data);
    if (result.ok) {
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
      }, 2000);
    } else {
      setError("root", { message: result.error });
    }
  });

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
      <FormMessage message={errors.root?.message ?? null} />
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label htmlFor="deuda" className="mb-2 block text-xs font-medium text-[#8b7355]">
            Deuda Actual ($)
          </label>
          <input
            type="number"
            id="deuda"
            step="0.01"
            {...register("deuda")}
            className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#3d3530] focus:border-[#c4a77d] focus:outline-none"
          />
          <FieldError message={errors.deuda?.message} />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-[#c4a77d] px-6 py-3 text-sm font-medium text-white shadow-sm active:scale-[0.99] disabled:opacity-50"
        >
          {isSubmitting ? "..." : saved ? "Guardado" : "Guardar"}
        </button>
      </div>
    </form>
  );
}
