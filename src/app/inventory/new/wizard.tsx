"use client";

import Link from "next/link";
import { type ReactElement, useEffect, useState } from "react";
import { z } from "zod";

import { FormMessage } from "@/components/form-feedback";
import { useActionForm } from "@/components/hooks/use-action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/i18n";
import { saveInventory, startInventoryRun } from "@/lib/actions/inventory";
import { inventoryWeek, runDate } from "@/lib/inventory/run-display";
import type { InventoryRow } from "@/lib/queries/inventory";

import { FridgeGroup } from "../fridge-group";

export function InventoryWizard({ groups, today, continuing, userId }: {
  groups: { id: string; number: number; name: string | null; rows: InventoryRow[] }[];
  today: string; continuing: boolean; userId: string;
}): ReactElement {
  const [step, setStep] = useState(-1);
  const initialQuantities = Object.fromEntries(groups.flatMap((group) => group.rows.map((row) => [`${group.id}:${row.id}`, continuing ? row.current?.quantity ?? "" : ""])));
  const [quantities, setQuantities] = useState<Record<string, string>>(initialQuantities);
  const [ready, setReady] = useState(false);
  const [draftError, setDraftError] = useState("");
  const [discarding, setDiscarding] = useState(false);
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const draftKey = `inventory-draft-v1:${userId}:${inventoryWeek(today)}`;
  useEffect(() => {
    try {
      const stored = localStorage.getItem(draftKey);
      if (stored !== null) {
        const draft = z.object({ quantities: z.record(z.string(), z.string()), step: z.number().int().min(-1) }).parse(JSON.parse(stored));
        setQuantities({ ...initialQuantities, ...draft.quantities });
        setStep(Math.min(draft.step, groups.length));
      }
      setReady(true);
    } catch { setDraftError("No se pudo recuperar el borrador. Revisá el almacenamiento del navegador y recargá."); }
    // Restore once per user and inventory week, never overwrite edits on refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);
  function persist(nextQuantities: Record<string, string>, nextStep: number): void {
    setQuantities(nextQuantities);
    setStep(nextStep);
    try {
      localStorage.setItem(draftKey, JSON.stringify({ quantities: nextQuantities, step: nextStep }));
      setDraftError("");
    } catch { setDraftError("No se pudo guardar el borrador en este navegador. No salgas hasta guardar los conteos o reintentar."); }
  }
  function discard(): void {
    try {
      localStorage.removeItem(draftKey);
      setQuantities(initialQuantities);
      setStep(-1);
      setDiscarding(false);
      setDraftError("");
    } catch { setDraftError("No se pudo descartar el borrador. Intentá de nuevo."); }
  }
  const { error, isSubmitting, runAction } = useActionForm();
  const group = groups[step];
  function start(): void {
    persist(quantities, 0);
  }
  async function save(): Promise<void> {
    if (group == null) return;
    const counts = group.rows.map((row) => ({ productId: row.id, quantity: quantities[`${group.id}:${row.id}`] ?? "" })).filter((row) => row.quantity.trim() !== "");
    if (counts.length > 0) {
      const result = await runAction(async () => {
        const started = await startInventoryRun();
        if (!started.ok) return started;
        return saveInventory({ fridgeId: group.id, counts });
      });
      if (!result.ok) return;
    }
    persist(quantities, step + 1);
  }
  const missing = groups.reduce((total, fridge) => total + fridge.rows.filter((row) => (quantities[`${fridge.id}:${row.id}`] ?? "").trim() === "").length, 0);
  if (!ready) return <main><p>{draftError || "Cargando borrador…"}</p></main>;
  return <main className={`space-y-5 ${noticeDismissed ? "" : "pb-64 sm:pb-48"}`}>
    <Link className="text-sm underline" href="/inventory">← Heladeras</Link>
    <h1 className="app-title">{continuing ? "Editar inventario de la semana" : "Nuevo inventario"}</h1>
    <p>{runDate(today)}</p>
    <FormMessage message={error} />
    <FormMessage message={draftError} />
    {!noticeDismissed && <aside aria-label="Aviso sobre el borrador" className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-40 mx-auto max-w-md rounded-2xl border border-zinc-300 bg-white p-4 shadow-lg">
      <p className="text-sm font-semibold">Podés salir sin perder el borrador</p>
      <p className="mt-1 text-sm text-muted">Si salís sin guardar, tus cambios quedan en este navegador y no se aplican al inventario activo. Al tocar «Guardar», se guardan y se aplican los conteos de ese paso. Lo que ya guardaste sigue aplicado.</p>
      <Button variant="secondary" className="mt-3 w-full" onClick={() => { setNoticeDismissed(true); }}>Entendido</Button>
    </aside>}
    <Button variant="secondary" busy={isSubmitting} onClick={() => { setDiscarding(true); }}>Descartar borrador</Button>
    {discarding && <div className="space-y-2"><p>¿Descartar los cambios del borrador? Los conteos ya guardados se conservan.</p><Button variant="danger" busy={isSubmitting} onClick={discard}>Confirmar descarte</Button><Button variant="secondary" onClick={() => { setDiscarding(false); }}>Seguir editando</Button></div>}
    {step === -1 && <div className="app-card space-y-4 rounded-2xl p-5"><p>{continuing ? "Ya hay un inventario de esta semana. ¿Querés editar sus cantidades?" : "Contá una heladera por vez. Todos los conteos de martes a lunes se guardan como un solo inventario semanal."}</p><p className="text-sm text-muted">Vacío significa sin revisar; cero significa que no queda nada. Cada paso guarda sus conteos y conserva los inventarios anteriores.</p>{groups.length === 0 ? <p>Creá una heladera antes de comenzar.</p> : <Button busy={isSubmitting} onClick={start}>{continuing ? "Editar inventario de la semana" : "Comenzar inventario semanal"}</Button>}</div>}
    {group != null && <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void save(); }}>
      <p className="text-sm text-muted">Heladera {step + 1} de {groups.length}</p>
      <fieldset disabled={isSubmitting}><FridgeGroup number={group.number} name={group.name}>
        {group.rows.length === 0 && <p>Sin productos en esta heladera.</p>}
        <ul className="divide-y divide-cream-dark">{group.rows.map((row) => <li key={row.id} className="py-3"><label className="block text-sm">{row.name} ({row.unit})<Input type="number" inputMode="decimal" min="0" max="9999999999.99" step="0.01" placeholder="Sin revisar" value={quantities[`${group.id}:${row.id}`] ?? ""} onChange={(event) => { persist({ ...quantities, [`${group.id}:${row.id}`]: event.target.value }, step); }} /></label>{row.note !== null && <p className="whitespace-pre-wrap text-sm text-muted">{row.note}</p>}</li>)}</ul>
      </FridgeGroup></fieldset>
      <div className="flex gap-2">{step > 0 && <Button variant="secondary" busy={isSubmitting} onClick={() => { persist(quantities, step - 1); }}>Anterior</Button>}<Button type="submit" busy={isSubmitting}>{isSubmitting ? "Guardando…" : step === groups.length - 1 ? "Guardar y terminar" : "Guardar y siguiente"}</Button></div>
    </form>}
    {step >= groups.length && step >= 0 && <div className="app-card space-y-3 rounded-2xl p-5"><p role="status">Los conteos ingresados quedaron guardados en el inventario de la semana.</p>{missing > 0 && <p>{missing} productos quedaron sin revisar. No se registraron como cero.</p>}<Link href="/inventory/list" className="block font-medium underline">Ver inventario</Link><Link href="/inventory/purchases" className="block font-medium underline">{t.inventoryPurchases.title}</Link><Button variant="secondary" onClick={() => { persist(quantities, 0); }}>Revisar heladeras</Button></div>}
  </main>;
}
