"use client";

import { type ReactElement, useState } from "react";

import { FormMessage } from "@/components/form-feedback";
import { useActionForm } from "@/components/hooks/use-action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { t } from "@/i18n";
import { createProductForProvider } from "@/lib/actions/products";
import { getFormString } from "@/lib/form";
import type { UnitOption } from "@/lib/types/providers";

export function AddProductForm({
  providerId,
  units,
}: {
  providerId: string;
  units: UnitOption[];
}): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const { error, isSubmitting, runAction } = useActionForm();

  const defaultUnitId =
    units.find((u) => u.code === "unidad")?.id ?? units[0]?.id ?? "";

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await runAction(() =>
      createProductForProvider(
        providerId,
        {
          name: getFormString(formData, "name"),
          unitId: getFormString(formData, "unitId"),
          description: getFormString(formData, "description") || null,
        },
        getFormString(formData, "price"),
        getFormString(formData, "quantity")
      )
    );
    if (!result.ok) return;
    setIsOpen(false);
    form.reset();
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => { setIsOpen(true); }}
        variant="secondary"
        className="w-full border-dashed border-[#c4a77d] py-4 text-sm text-[#c4a77d] hover:bg-white"
      >
        + {t.products.addCta}
      </Button>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 rounded-xl bg-white p-4">
      <FormMessage message={error} />
      <div>
        <Input
          type="text"
          name="name"
          required
          aria-label={t.products.fields.name}
          placeholder={t.products.fields.namePlaceholder}
          className="rounded-lg px-3"
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Input
            type="number"
            name="quantity"
            step="0.01"
            required
            aria-label={t.products.fields.packQuantity}
            defaultValue="1"
            placeholder={t.products.fields.quantityPlaceholder}
            className="rounded-lg px-3"
          />
        </div>
        <div>
          <Select
            name="unitId"
            aria-label={t.products.fields.unit}
            defaultValue={defaultUnitId}
            className="rounded-lg px-3"
          >
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Input
            type="number"
            name="price"
            step="0.01"
            required
            aria-label={t.products.fields.price}
            placeholder={t.products.fields.pricePlaceholder}
            className="rounded-lg px-3"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          onClick={() => { setIsOpen(false); }}
          variant="secondary"
          className="flex-1 rounded-lg py-3 text-sm"
        >
          {t.common.cancel}
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-lg py-3 text-sm"
        >
          {isSubmitting ? t.products.adding : t.common.add}
        </Button>
      </div>
    </form>
  );
}
