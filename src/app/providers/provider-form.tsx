"use client";

import { useRouter } from "next/navigation";
import { type ReactElement, useState } from "react";

import { FormMessage } from "@/components/form-feedback";
import { useActionForm } from "@/components/hooks/use-action-form";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { t } from "@/i18n";
import { createProvider, updateProvider } from "@/lib/actions/providers";
import { getFormString } from "@/lib/form";
import type { ProviderType, ProviderView } from "@/lib/types/providers";

const DAY_KEYS = ["L", "M", "X", "J", "V", "S", "D"] as const;

export function ProviderForm({ provider }: { provider?: ProviderView }): ReactElement {
  const router = useRouter();
  const { error, isSubmitting, runAction } = useActionForm();
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
    const formData = new FormData(e.currentTarget);
    const data = {
      name: getFormString(formData, "name"),
      description: getFormString(formData, "description") || null,
      type,
      days: selectedDays.length > 0 ? selectedDays.join(",") : null,
    };

    if (isEditing) {
      const result = await runAction(() => updateProvider(provider.id, data));
      if (!result.ok) return;
      router.push(`/providers/${provider.id}`);
    } else {
      const result = await runAction(() => createProvider(data));
      if (!result.ok) return;
      router.push(`/providers/${result.data.id}`);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
      <FormMessage message={error} />
      <div>
        <p className="mb-2 text-xs font-medium text-[#8b7355]">{t.providers.fields.type}</p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            onClick={() => { setType("producto"); }}
            variant={type === "producto" ? "primary" : "ghost"}
            className="py-3 text-sm"
          >
            {t.providers.types.producto}
          </Button>
          <Button
            type="button"
            onClick={() => { setType("servicio"); }}
            variant={type === "servicio" ? "primary" : "ghost"}
            className="py-3 text-sm"
          >
            {t.providers.types.servicio}
          </Button>
        </div>
      </div>

      <FormField htmlFor="provider-name" label={t.providers.fields.name}>
        <Input
          type="text"
          id="provider-name"
          name="name"
          required
          defaultValue={provider?.name}
          placeholder={t.providers.fields.namePlaceholder}
        />
      </FormField>

      <FormField htmlFor="provider-description" label={t.providers.fields.description}>
        <Input
          type="text"
          id="provider-description"
          name="description"
          defaultValue={provider?.description ?? ""}
          placeholder={t.providers.fields.descriptionPlaceholder}
        />
      </FormField>

      <div>
        <p className="mb-2 text-xs font-medium text-[#8b7355]">{t.providers.fields.visitDays}</p>
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

      <Button type="submit" disabled={isSubmitting} className="w-full py-4 text-base">
        {isSubmitting ? t.common.saving : isEditing ? t.common.saveChanges : t.providers.create}
      </Button>
    </form>
  );
}
