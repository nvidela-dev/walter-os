"use client";

import { type ReactElement, useState } from "react";

import { FormMessage } from "@/components/form-feedback";
import { t } from "@/i18n";
import { getFormString } from "@/lib/form";

import { createProductForProvider } from "../actions";

interface UnitOption {
  id: string;
  code: string;
  name: string;
}

export function AddProductForm({
  providerId,
  units,
}: {
  providerId: string;
  units: UnitOption[];
}): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultUnitId =
    units.find((u) => u.code === "unidad")?.id ?? units[0]?.id ?? "";

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createProductForProvider(
      providerId,
      {
        name: getFormString(formData, "name"),
        unitId: getFormString(formData, "unitId"),
        description: getFormString(formData, "description") || null,
      },
      getFormString(formData, "price"),
      getFormString(formData, "quantity")
    );

    setIsSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setIsOpen(false);
    e.currentTarget.reset();
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => { setIsOpen(true); }}
        className="w-full rounded-xl border-2 border-dashed border-[#c4a77d] py-4 text-sm font-medium text-[#c4a77d] hover:bg-white"
      >
        + {t.products.addCta}
      </button>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 rounded-xl bg-white p-4">
      <FormMessage message={error} />
      <div>
        <input
          type="text"
          name="name"
          required
          placeholder={t.products.fields.namePlaceholder}
          className="w-full rounded-lg border-2 border-[#e8e0d4] px-3 py-3 text-sm text-[#3d3530] placeholder:text-[#c4a77d] focus:border-[#c4a77d] focus:outline-none"
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <input
            type="number"
            name="quantity"
            step="0.01"
            required
            defaultValue="1"
            placeholder={t.products.fields.quantityPlaceholder}
            className="w-full rounded-lg border-2 border-[#e8e0d4] px-3 py-3 text-sm text-[#3d3530] placeholder:text-[#c4a77d] focus:border-[#c4a77d] focus:outline-none"
          />
        </div>
        <div>
          <select
            name="unitId"
            defaultValue={defaultUnitId}
            className="w-full rounded-lg border-2 border-[#e8e0d4] px-3 py-3 text-sm text-[#3d3530] focus:border-[#c4a77d] focus:outline-none"
          >
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <input
            type="number"
            name="price"
            step="0.01"
            required
            placeholder={t.products.fields.pricePlaceholder}
            className="w-full rounded-lg border-2 border-[#e8e0d4] px-3 py-3 text-sm text-[#3d3530] placeholder:text-[#c4a77d] focus:border-[#c4a77d] focus:outline-none"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setIsOpen(false); }}
          className="flex-1 rounded-lg border-2 border-[#e8e0d4] py-3 text-sm font-medium text-[#8b7355]"
        >
          {t.common.cancel}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-lg bg-[#c4a77d] py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {isSubmitting ? t.products.adding : t.common.add}
        </button>
      </div>
    </form>
  );
}
