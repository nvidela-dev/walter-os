"use client";

import { useState } from "react";
import { FormMessage } from "@/components/form-feedback";
import { updateProviderDebt } from "../actions";

export function DebtForm({ providerId, currentDebt }: { providerId: string; currentDebt: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setSaved(false);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const deuda = formData.get("deuda") as string || "0";

    const result = await updateProviderDebt(providerId, { deuda });
    setIsSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSaved(true);

    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <FormMessage message={error} />
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label htmlFor="deuda" className="mb-2 block text-xs font-medium text-[#8b7355]">Deuda Actual ($)</label>
          <input
            type="number"
            id="deuda"
            name="deuda"
            step="0.01"
            defaultValue={currentDebt}
            className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#3d3530] focus:border-[#c4a77d] focus:outline-none"
          />
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
