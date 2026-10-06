"use client";

import { useRouter } from "next/navigation";
import { type ReactElement, useState } from "react";

import { FormMessage } from "@/components/form-feedback";
import { useActionForm } from "@/components/hooks/use-action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { editInventoryEntry, removeInventoryEntry } from "@/lib/actions/inventory";
import { inventoryDate } from "@/lib/inventory/comparison";
import { runChange } from "@/lib/inventory/run-display";
import type { InventoryRow } from "@/lib/queries/inventory";

import { FridgeDetails } from "../fridge-details";
import { FridgeGroup } from "../fridge-group";

export function InventoryList({ groups }: { groups: { id: string; number: number; name: string | null; commentary: string | null; rows: InventoryRow[] }[] }): ReactElement {
  const router = useRouter();
  const { error, isSubmitting, runAction } = useActionForm();
  const [editing, setEditing] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  async function save(fridgeId: string, productId: string): Promise<void> {
    const original = groups.find((group) => group.id === fridgeId)?.rows.find((row) => row.id === productId)?.current?.quantity;
    const count = quantity === "" || (original != null && Number(original) === Number(quantity)) ? null : quantity;
    const result = await runAction(() => editInventoryEntry({ fridgeId, productId, quantity: count, note }));
    if (result.ok) { setEditing(null); router.refresh(); }
  }
  async function remove(fridgeId: string, productId: string): Promise<void> {
    const result = await runAction(() => removeInventoryEntry({ fridgeId, productId }));
    if (result.ok) { setRemoving(null); setEditing(null); router.refresh(); }
  }
  return <div className="space-y-6">
    <FormMessage message={error} />
    {groups.length === 0 && <p>No hay heladeras.</p>}
    {groups.map((fridge) => <FridgeGroup key={fridge.id} number={fridge.number} name={fridge.name}>
      <FridgeDetails fridge={fridge} />
      {fridge.rows.length === 0 && <p className="text-sm text-muted">Sin productos.</p>}
      <ul className="divide-y divide-cream-dark">
        {fridge.rows.map((row) => {
          const key = `${fridge.id}:${row.id}`;
          return <li key={row.id} className="py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span>{row.name} — {row.current === null ? "Sin conteo" : `${row.current.quantity} ${row.current.unit}`}</span>
              <div className="flex gap-3"><button type="button" className="text-sm underline" disabled={isSubmitting} onClick={() => { setEditing(key); setQuantity(row.current?.quantity ?? ""); setNote(row.note ?? ""); }}>Editar</button><button type="button" className="text-sm underline" disabled={isSubmitting} onClick={() => { setRemoving(key); }}>Quitar</button></div>
            </div>
            {row.runInitial === false && row.current !== null && <p className="text-sm text-muted">{runChange(row.difference)}</p>}
            <p className="whitespace-pre-wrap text-sm text-muted">Nota: {row.note ?? "—"}</p>
            {row.current !== null && <p className="text-xs text-muted">{inventoryDate(row.current.recordedAt)}</p>}
            {removing === key && <div className="mt-2 space-y-2"><p className="text-sm">¿Quitar {row.name} de esta heladera? Su historial se conserva.</p><div className="flex gap-2"><Button disabled={isSubmitting} onClick={() => { void remove(fridge.id, row.id); }}>Confirmar quitar</Button><Button variant="secondary" disabled={isSubmitting} onClick={() => { setRemoving(null); }}>Cancelar</Button></div></div>}
            {editing === key && <form className="mt-2 flex flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); void save(fridge.id, row.id); }}>
              <label className="w-full text-sm">Cantidad ({row.unit})<Input type="number" min="0" max="9999999999.99" step="0.01" inputMode="decimal" value={quantity} disabled={isSubmitting} onChange={(event) => { setQuantity(event.target.value); }} /></label>
              <label className="w-full text-sm">Nota<textarea className="mt-1 w-full rounded-xl border p-3" rows={2} maxLength={1000} value={note} disabled={isSubmitting} onChange={(event) => { setNote(event.target.value); }} /></label>
              <Button type="submit" disabled={isSubmitting}>Guardar</Button><Button variant="secondary" disabled={isSubmitting} onClick={() => { setEditing(null); }}>Cancelar</Button>
            </form>}
          </li>;
        })}
      </ul>
    </FridgeGroup>)}
  </div>;
}
