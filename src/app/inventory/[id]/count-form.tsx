"use client";

import { type ReactElement, type SyntheticEvent, useState } from "react";

import { FormMessage } from "@/components/form-feedback";
import { useActionForm } from "@/components/hooks/use-action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/i18n";
import { saveInventory } from "@/lib/actions/inventory";
import { getFormString } from "@/lib/form";
import { inventoryDate } from "@/lib/inventory/comparison";
import type { InventoryRow } from "@/lib/queries/inventory";

export function CountForm({ fridgeId, rows }: { fridgeId: string; rows: InventoryRow[] }): ReactElement {
  const { error, isSubmitting, runAction } = useActionForm();
  const [saved, setSaved] = useState(false);
  async function submit(event: SyntheticEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setSaved(false);
    const counts = rows.map((row) => ({ productId: row.id, quantity: getFormString(data, row.id).trim() })).filter((count) => count.quantity !== "");
    const result = await runAction(() => saveInventory({ fridgeId, counts }));
    if (result.ok) { form.reset(); setSaved(true); }
  }
  if (rows.length === 0) return <p className="py-8 text-center text-muted">{t.inventory.noItems}</p>;
  return <form onSubmit={(event) => void submit(event)} onChange={() => { setSaved(false); }} className="space-y-3">
    <p className="text-sm text-muted">{t.inventory.hint}</p>
    <fieldset disabled={isSubmitting} className="space-y-3">
      {rows.map((row) => <article key={row.id} className="ios-glass rounded-2xl p-4">
        <h2 className="text-lg font-semibold">{row.name}</h2>
        <p className="text-xs text-muted">{row.providers.length > 0 ? row.providers.join(" · ") : t.inventory.noProvider}</p>
        <div className="my-3 flex items-start justify-between gap-4">
          <div><p className="text-xs text-muted">{t.inventory.current}</p>
            <p className="text-2xl font-semibold">{row.current === null ? "—" : `${row.current.quantity} ${row.current.unit}`}</p>
            <p className="text-xs text-muted">{row.current === null ? t.inventory.noCount : inventoryDate(row.current.recordedAt)}</p>
          </div>
          <div className="max-w-[55%] text-right text-sm">
            <p>{row.difference === null ? (row.previous === null ? t.inventory.noPrevious : t.inventory.unitChanged) : row.difference === "0" ? t.inventory.unchanged : `${Number(row.difference) > 0 ? "+" : ""}${row.difference} · ${t.inventory.change}`}</p>
            {row.previous !== null && <p className="mt-1 text-xs text-muted">{t.inventory.comparedAt}: {inventoryDate(row.previous.recordedAt)} · {row.previous.quantity} {row.previous.unit}</p>}
          </div>
        </div>
        <label className="block text-sm" htmlFor={`count-${row.id}`}>{t.inventory.now} ({row.unit})</label>
        <Input id={`count-${row.id}`} name={row.id} type="number" inputMode="decimal" min="0" max="9999999999.99" step="0.01" placeholder="—" className="mt-1 text-lg" />
      </article>)}
    </fieldset>
    <div className="sticky bottom-0 space-y-2 rounded-2xl bg-cream p-3 shadow-lg">
      <FormMessage message={error} />
      {saved && <p role="status" className="text-center text-sm">{t.inventory.saved}</p>}
      <Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? t.inventory.saving : t.inventory.save}</Button>
    </div>
  </form>;
}
