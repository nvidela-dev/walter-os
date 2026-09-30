"use client";

import type { ReactElement, SyntheticEvent } from "react";

import { FormMessage } from "@/components/form-feedback";
import { useActionForm } from "@/components/hooks/use-action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { t } from "@/i18n";
import { addFridgeProduct, createInventoryProduct } from "@/lib/actions/inventory";
import { getFormString } from "@/lib/form";
import type { UnitOption } from "@/lib/types/providers";

export function CatalogueForm({ fridgeId, matches, units, query }: {
  fridgeId: string; matches: { id: string; name: string; unit: string }[]; units: UnitOption[]; query: string;
}): ReactElement {
  const { error, isSubmitting, runAction } = useActionForm();
  async function create(event: SyntheticEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const result = await runAction(() => createInventoryProduct({ fridgeId, name: getFormString(data, "name"), unitId: getFormString(data, "unitId") }));
    if (result.ok) form.reset();
  }
  return <div className="space-y-3">
    <FormMessage message={error} />
    {query !== "" && matches.length === 0 && <p className="text-sm">{t.inventory.noMatches}</p>}
    {matches.map((product) => <div className="flex items-center justify-between gap-3 border-b border-cream-dark pb-3" key={product.id}>
      <span>{product.name} <small className="text-muted">({product.unit})</small></span>
      <Button disabled={isSubmitting} variant="secondary" onClick={() => { void runAction(() => addFridgeProduct({ fridgeId, productId: product.id })); }}>{t.inventory.add}</Button>
    </div>)}
    <details><summary className="cursor-pointer py-3 text-sm">{t.inventory.missing}</summary>
      <form onSubmit={(event) => void create(event)} className="space-y-3">
        <label className="block">{t.inventory.productName}<Input name="name" required maxLength={200} defaultValue={query} /></label>
        <label className="block">{t.inventory.unit}<Select name="unitId" defaultValue={units.find((unit) => unit.code === "unidad")?.id ?? units[0]?.id} required>
          {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
        </Select></label>
        <Button type="submit" disabled={isSubmitting || units.length === 0}>{t.inventory.create}</Button>
      </form>
    </details>
  </div>;
}
