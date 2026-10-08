"use client";

import { useRouter } from "next/navigation";
import { type ReactElement, type SyntheticEvent, useState } from "react";

import { FormMessage } from "@/components/form-feedback";
import { useActionForm } from "@/components/hooks/use-action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/i18n";
import { updateFridgeDetails } from "@/lib/actions/inventory";
import { getFormString } from "@/lib/form";

export function FridgeDetails({ fridge }: { fridge: { id: string; number: number; name: string | null; commentary: string | null } }): ReactElement {
  const router = useRouter();
  const { error, isSubmitting, runAction } = useActionForm();
  const [open, setOpen] = useState(false);
  async function save(event: SyntheticEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const result = await runAction(() => updateFridgeDetails({ fridgeId: fridge.id, number: getFormString(data, "number"), name: getFormString(data, "name"), commentary: getFormString(data, "commentary") }));
    if (result.ok) { setOpen(false); router.refresh(); }
  }
  return <div className="space-y-2">
    {fridge.commentary !== null && <p className="whitespace-pre-wrap text-sm text-muted">Comentario: {fridge.commentary}</p>}
    <button type="button" disabled={isSubmitting} className="app-text-action -ml-2 whitespace-nowrap" onClick={() => { setOpen(!open); }}>{t.inventory.editFridge}</button>
    {open && <form onSubmit={(event) => { void save(event); }} className="space-y-3">
      <FormMessage message={error} />
      <fieldset disabled={isSubmitting} className="space-y-3">
        <label className="block text-sm">Número de la heladera<Input name="number" type="number" min="1" max="2147483647" step="1" inputMode="numeric" required defaultValue={fridge.number} /></label>
        <label className="block text-sm">Nombre de la heladera<Input name="name" defaultValue={fridge.name ?? ""} maxLength={200} /></label>
        <label className="block text-sm">Comentario de la heladera<textarea name="commentary" defaultValue={fridge.commentary ?? ""} maxLength={1000} rows={3} className="mt-1 w-full rounded-xl border p-3" /></label>
        <div className="flex gap-2"><Button type="submit">Guardar heladera</Button><Button variant="secondary" onClick={() => { setOpen(false); }}>Cancelar</Button></div>
      </fieldset>
    </form>}
  </div>;
}
