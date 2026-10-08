"use client";

import Link from "next/link";
import { type ReactElement, useState } from "react";

import { FormMessage } from "@/components/form-feedback";
import { useActionForm } from "@/components/hooks/use-action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/i18n";
import { saveInventory, startInventoryRun } from "@/lib/actions/inventory";
import { runDate } from "@/lib/inventory/run-display";
import type { InventoryRow } from "@/lib/queries/inventory";

import { FridgeGroup } from "../fridge-group";

export function InventoryWizard({ groups, today, continuing }: {
  groups: { id: string; number: number; name: string | null; rows: InventoryRow[] }[];
  today: string; continuing: boolean;
}): ReactElement {
  const [step, setStep] = useState(-1);
  const [quantities, setQuantities] = useState<Record<string, string>>(() => Object.fromEntries(groups.flatMap((group) => group.rows.map((row) => [`${group.id}:${row.id}`, continuing ? row.current?.quantity ?? "" : ""]))));
  const { error, isSubmitting, runAction } = useActionForm();
  const group = groups[step];
  async function start(): Promise<void> {
    const result = await runAction(startInventoryRun);
    if (result.ok) setStep(0);
  }
  async function save(): Promise<void> {
    if (group == null) return;
    const counts = group.rows.map((row) => ({ productId: row.id, quantity: quantities[`${group.id}:${row.id}`] ?? "" })).filter((row) => row.quantity.trim() !== "");
    if (counts.length > 0) {
      const result = await runAction(() => saveInventory({ fridgeId: group.id, counts }));
      if (!result.ok) return;
    }
    setStep(step + 1);
  }
  const missing = groups.reduce((total, fridge) => total + fridge.rows.filter((row) => (quantities[`${fridge.id}:${row.id}`] ?? "").trim() === "").length, 0);
  return <main className="space-y-5">
    <Link className="text-sm underline" href="/inventory">← Heladeras</Link>
    <h1 className="text-3xl font-semibold">{continuing ? "Editar inventario de la semana" : "Nuevo inventario"}</h1>
    <p>{runDate(today)}</p>
    <FormMessage message={error} />
    {step === -1 && <div className="app-card space-y-4 rounded-2xl p-5"><p>{continuing ? "Ya hay un inventario de esta semana. ¿Querés editar sus cantidades?" : "Contá una heladera por vez. Todos los conteos de martes a lunes se guardan como un solo inventario semanal."}</p><p className="text-sm text-muted">Vacío significa sin revisar; cero significa que no queda nada. Cada paso guarda sus conteos y conserva los inventarios anteriores.</p>{groups.length === 0 ? <p>Creá una heladera antes de comenzar.</p> : <Button disabled={isSubmitting} onClick={() => { void start(); }}>{continuing ? "Editar inventario de la semana" : "Comenzar inventario semanal"}</Button>}</div>}
    {group != null && <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void save(); }}>
      <p className="text-sm text-muted">Heladera {step + 1} de {groups.length}</p>
      <fieldset disabled={isSubmitting}><FridgeGroup number={group.number} name={group.name}>
        {group.rows.length === 0 && <p>Sin productos en esta heladera.</p>}
        <ul className="divide-y divide-cream-dark">{group.rows.map((row) => <li key={row.id} className="py-3"><label className="block text-sm">{row.name} ({row.unit})<Input type="number" inputMode="decimal" min="0" max="9999999999.99" step="0.01" placeholder="Sin revisar" value={quantities[`${group.id}:${row.id}`] ?? ""} onChange={(event) => { setQuantities({ ...quantities, [`${group.id}:${row.id}`]: event.target.value }); }} /></label>{row.note !== null && <p className="whitespace-pre-wrap text-sm text-muted">{row.note}</p>}</li>)}</ul>
      </FridgeGroup></fieldset>
      <div className="flex gap-2">{step > 0 && <Button variant="secondary" disabled={isSubmitting} onClick={() => { setStep(step - 1); }}>Anterior</Button>}<Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando…" : step === groups.length - 1 ? "Guardar y terminar" : "Guardar y siguiente"}</Button></div>
    </form>}
    {step >= groups.length && step >= 0 && <div className="app-card space-y-3 rounded-2xl p-5"><p role="status">Los conteos ingresados quedaron guardados en el inventario de la semana.</p>{missing > 0 && <p>{missing} productos quedaron sin revisar. No se registraron como cero.</p>}<Link href="/inventory/list" className="block font-medium underline">Ver inventario</Link><Link href="/inventory/purchases" className="block font-medium underline">{t.inventoryPurchases.title}</Link><Button variant="secondary" onClick={() => { setStep(0); }}>Revisar heladeras</Button></div>}
  </main>;
}
