"use client";

import { useRouter } from "next/navigation";
import { type ReactElement, useState } from "react";

import { FormMessage } from "@/components/form-feedback";
import { useActionForm } from "@/components/hooks/use-action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { addDrinkItem } from "@/lib/actions/drinks";
import { getFormString } from "@/lib/form";
import type { UnitOption } from "@/lib/types/providers";

export function AddDrinkForm({ units, locations, category = "Alcoholes" }: { units: UnitOption[]; locations: string[]; category?: string }): ReactElement {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const { error, isSubmitting, runAction } = useActionForm();
  async function submit(form: HTMLFormElement): Promise<void> {
    setSaved(false);
    const data = new FormData(form);
    const result = await runAction(() => addDrinkItem({
      name: getFormString(data, "name"), unitId: getFormString(data, "unitId"),
      location: getFormString(data, "location"), category: getFormString(data, "category"),
      countUnit: getFormString(data, "countUnit") || null,
    }));
    if (result.ok) { form.reset(); setSaved(true); router.refresh(); }
  }
  return <form className="space-y-3 rounded-xl border p-4" onSubmit={(event) => { event.preventDefault(); void submit(event.currentTarget); }}>
    <fieldset disabled={isSubmitting} className="space-y-3">
      <label className="block text-sm">Nombre<Input name="name" required maxLength={200} placeholder="Ej.: Agua sin gas 600 ml" /></label>
        <input type="hidden" name="category" value={category} />
      <label className="block text-sm">Ubicación<Input name="location" required maxLength={200} defaultValue="Bar" list="drink-locations" /></label>
      <datalist id="drink-locations">{locations.map((location) => <option key={location} value={location} />)}</datalist>
      <label className="block text-sm">Unidad del producto<Select name="unitId" required defaultValue=""><option value="" disabled>Elegí una unidad</option>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name} ({unit.code})</option>)}</Select></label>
      <label className="block text-sm">Cómo se cuenta<Select name="countUnit" defaultValue="botella"><option value="botella">Botellas individuales</option><option value="">Unidad del producto</option></Select></label>
      <Button type="submit">{isSubmitting ? "Guardando…" : "Agregar bebida"}</Button>
    </fieldset>
    <FormMessage message={error} />
    {saved && <p role="status" className="text-sm text-emerald-800">Bebida agregada. Ya aparece en el inventario para contar.</p>}
  </form>;
}
