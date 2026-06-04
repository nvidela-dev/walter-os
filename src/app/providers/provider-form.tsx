"use client";

import { useRouter } from "next/navigation";
import { type ReactElement, useState } from "react";

import { FormMessage } from "@/components/form-feedback";
import type { Provider, ProviderType } from "@/db/schema";
import { t } from "@/i18n";
import { getFormString } from "@/lib/form";

import { createProvider, updateProvider } from "./actions";

const DAY_KEYS = ["L", "M", "X", "J", "V", "S", "D"] as const;

export function ProviderForm({ provider }: { provider?: Provider }): ReactElement {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<ProviderType>(provider?.type ?? "producto");
  const [selectedDays, setSelectedDays] = useState<string[]>(
    provider?.days != null ? provider.days.split(",") : []
  );
  const isEditing = !!provider;

  function toggleDay(day: string): void {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const data = {
      name: getFormString(formData, "name"),
      description: getFormString(formData, "description") || null,
      type,
      days: selectedDays.length > 0 ? selectedDays.join(",") : null,
    };

    if (isEditing) {
      const result = await updateProvider(provider.id, data);
      if (!result.ok) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }
      router.push(`/providers/${provider.id}`);
    } else {
      const result = await createProvider(data);
      if (!result.ok) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }
      router.push(`/providers/${result.data.id}`);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
      <FormMessage message={error} />
      <div>
        <label className="mb-2 block text-xs font-medium text-[#8b7355]">{t.providers.fields.type}</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => { setType("producto"); }}
            className={`rounded-xl py-3 text-sm font-medium transition-colors ${
              type === "producto" ? "bg-[#c4a77d] text-white" : "bg-[#e8e0d4] text-[#8b7355]"
            }`}
          >
            {t.providers.types.producto}
          </button>
          <button
            type="button"
            onClick={() => { setType("servicio"); }}
            className={`rounded-xl py-3 text-sm font-medium transition-colors ${
              type === "servicio" ? "bg-[#c4a77d] text-white" : "bg-[#e8e0d4] text-[#8b7355]"
            }`}
          >
            {t.providers.types.servicio}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="name" className="mb-2 block text-xs font-medium text-[#8b7355]">{t.providers.fields.name}</label>
        <input type="text" id="name" name="name" required defaultValue={provider?.name}
          placeholder={t.providers.fields.namePlaceholder}
          className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#3d3530] placeholder:text-[#c4a77d] focus:border-[#c4a77d] focus:outline-none" />
      </div>

      <div>
        <label htmlFor="description" className="mb-2 block text-xs font-medium text-[#8b7355]">{t.providers.fields.description}</label>
        <input type="text" id="description" name="description" defaultValue={provider?.description ?? ""}
          placeholder={t.providers.fields.descriptionPlaceholder}
          className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#3d3530] placeholder:text-[#c4a77d] focus:border-[#c4a77d] focus:outline-none" />
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-[#8b7355]">{t.providers.fields.visitDays}</label>
        <div className="flex gap-2">
          {DAY_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => { toggleDay(key); }}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                selectedDays.includes(key)
                  ? "bg-amber-500 text-white"
                  : "bg-[#e8e0d4] text-[#8b7355]"
              }`}
              title={t.providers.days[key]}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      <button type="submit" disabled={isSubmitting}
        className="w-full rounded-xl bg-[#c4a77d] py-4 text-base font-medium text-white shadow-sm active:scale-[0.99] disabled:opacity-50">
        {isSubmitting ? t.common.saving : isEditing ? t.common.saveChanges : t.providers.create}
      </button>
    </form>
  );
}
