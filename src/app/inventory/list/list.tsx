"use client";

import { useRouter } from "next/navigation";
import { type ReactElement, useState } from "react";

import { FormMessage } from "@/components/form-feedback";
import { useActionForm } from "@/components/hooks/use-action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { removeInventoryEntry, saveInventory } from "@/lib/actions/inventory";
import { inventoryDate } from "@/lib/inventory/comparison";
import type { InventoryRow } from "@/lib/queries/inventory";

export function InventoryList({ groups }: { groups: { id: string; number: number; name: string | null; rows: InventoryRow[] }[] }): ReactElement {
  const router = useRouter();
  const { error, isSubmitting, runAction } = useActionForm();
  const [editing, setEditing] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("");
  async function save(fridgeId: string, productId: string): Promise<void> {
    const result = await runAction(() => saveInventory({ fridgeId, counts: [{ productId, quantity }] }));
    if (result.ok) { setEditing(null); router.refresh(); }
  }
  async function remove(fridgeId: string, productId: string): Promise<void> {
    const result = await runAction(() => removeInventoryEntry({ fridgeId, productId }));
    if (result.ok) { setRemoving(null); setEditing(null); router.refresh(); }
  }
  return <div className="space-y-6">
    <FormMessage message={error} />
    {groups.length === 0 && <p>No hay heladeras.</p>}
    {groups.map((fridge) => <section key={fridge.id} className="space-y-2">
      <h2 className="text-lg font-semibold">Heladera {fridge.number}{fridge.name === null ? "" : ` · ${fridge.name}`}</h2>
      {fridge.rows.length === 0 && <p className="text-sm text-muted">Sin productos.</p>}
      <ul className="divide-y divide-cream-dark">
        {fridge.rows.map((row) => {
          const key = `${fridge.id}:${row.id}`;
          return <li key={row.id} className="py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span>{row.name} — {row.current === null ? "Sin conteo" : `${row.current.quantity} ${row.current.unit}`}</span>
              <div className="flex gap-3"><button type="button" className="text-sm underline" disabled={isSubmitting} onClick={() => { setEditing(key); setQuantity(row.current?.quantity ?? ""); }}>Editar</button><button type="button" className="text-sm underline" disabled={isSubmitting} onClick={() => { setRemoving(key); }}>Quitar</button></div>
            </div>
            {row.current !== null && <p className="text-xs text-muted">{inventoryDate(row.current.recordedAt)}</p>}
            {removing === key && <div className="mt-2 space-y-2"><p className="text-sm">¿Quitar {row.name} de esta heladera? Su historial se conserva.</p><div className="flex gap-2"><Button disabled={isSubmitting} onClick={() => { void remove(fridge.id, row.id); }}>Confirmar quitar</Button><Button variant="secondary" disabled={isSubmitting} onClick={() => { setRemoving(null); }}>Cancelar</Button></div></div>}
            {editing === key && <form className="mt-2 flex flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); void save(fridge.id, row.id); }}>
              <label className="w-full text-sm">Cantidad ({row.unit})<Input type="number" min="0" max="9999999999.99" step="0.01" inputMode="decimal" required value={quantity} disabled={isSubmitting} onChange={(event) => { setQuantity(event.target.value); }} /></label>
              <Button type="submit" disabled={isSubmitting}>Guardar</Button><Button variant="secondary" disabled={isSubmitting} onClick={() => { setEditing(null); }}>Cancelar</Button>
            </form>}
          </li>;
        })}
      </ul>
    </section>)}
  </div>;
}
