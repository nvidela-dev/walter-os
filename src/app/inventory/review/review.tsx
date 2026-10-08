"use client";

import Link from "next/link";
import { type ReactElement, useEffect, useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { addManualCatalogue } from "@/lib/actions/manual-catalogue";
import { manualCandidates } from "@/lib/inventory/manual-catalogue";
import type { UnitOption } from "@/lib/types/providers";

const rowSchema = z.object({ id: z.string(), name: z.string(), fridgeId: z.string(), unitId: z.string(), productId: z.string(), status: z.enum(["pending", "reviewed", "skipped", "saved"]) });
type Row = z.infer<typeof rowSchema>;
const initial: Row[] = manualCandidates.map((row) => ({ id: row.id, name: row.name, fridgeId: "", unitId: "", productId: "", status: "pending" }));

export function ManualReview({ userId, photos, fridges, units, catalogue }: {
  userId: string; photos: string[]; fridges: { id: string; number: number; name: string | null }[];
  units: UnitOption[]; catalogue: { id: string; name: string; unitId: string | null }[];
}): ReactElement {
  const [rows, setRows] = useState(initial);
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const key = `manual-catalogue-two-pages-v1:${userId}`;
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        const parsed = z.array(rowSchema).parse(JSON.parse(stored));
        if (parsed.length !== initial.length || parsed.some((row, i) => row.id !== initial[i]?.id)) throw new Error("Invalid draft");
        setRows(parsed);
      }
      setReady(true);
    } catch { setError("No se pudo recuperar la revisión. Revisá el almacenamiento del navegador y recargá."); }
  }, [key]);
  const row = rows[index];
  const source = manualCandidates[index];
  const reviewed = rows.filter((item) => item.status === "reviewed");
  function persist(next: Row[]): boolean {
    try { localStorage.setItem(key, JSON.stringify(next)); setRows(next); return true; }
    catch { setError("No se pudo guardar la revisión en este navegador."); return false; }
  }
  function edit(patch: Partial<Row>): void {
    if (row == null) return;
    persist(rows.map((item) => item.id === row.id ? { ...item, ...patch, status: "pending" } : item));
  }
  function finish(status: "reviewed" | "skipped"): void {
    if (row == null) return;
    if (persist(rows.map((item) => item.id === row.id ? { ...item, status } : item))) setIndex(Math.min(index + 1, rows.length - 1));
  }
  async function save(): Promise<void> {
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await addManualCatalogue(reviewed.map((item) => ({ name: item.name, fridgeId: item.fridgeId, unitId: item.unitId, productId: item.productId === "" ? null : item.productId })));
      if (!result.ok) { setError(result.error); return; }
      const next: Row[] = rows.map((item) => item.status === "reviewed" ? { ...item, status: "saved" } : item);
      setRows(next); persist(next);
      setMessage("Lote agregado al catálogo. Las cantidades de la hoja no se registraron como stock actual.");
    } catch { setError("No se pudo confirmar el lote. Tu revisión se conserva para reintentar."); }
    finally { setBusy(false); }
  }
  return <main className="space-y-5">
    <Link href="/inventory" className="text-sm underline">← Heladeras</Link>
    <h1 className="text-3xl font-semibold">Revisar inventario en papel</h1>
    <p>Las dos páginas del 29/9/26 están transcritas como posibles productos. Confirmá los nombres, las unidades y dónde se guardan.</p>
    <p className="text-sm text-muted">Tu progreso queda en este navegador. «HAY», fracciones y símbolos quedan como referencia; este paso arma el catálogo y no carga conteos.</p>
    {error !== "" && <p role="alert">{error}</p>}{message !== "" && <p role="status">{message}</p>}
    {!ready && <p>Cargando revisión…</p>}
    {ready && row != null && source != null && <fieldset disabled={busy} className="space-y-4">
      <p>Posible producto {index + 1} de {rows.length} · Página {source.page} · {source.section}</p>
      <details open><summary className="cursor-pointer">Ver foto original · página {source.page}</summary>
        {/* These private source photos are supplied only by the authorized server page. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photos[source.page - 1]} alt={`Inventario manuscrito, página ${source.page}`} className="max-h-[32rem] w-full rounded-xl object-contain" />
      </details>
      <div className="app-card space-y-3 rounded-2xl p-4"><h2 className="text-lg font-semibold">Lo que leí</h2><p>{source.transcription}</p><p className="rounded-xl bg-amber-50 p-3 text-amber-900">{source.question}</p></div>
      {row.status === "saved" ? <p>Este producto ya fue agregado.</p> : <>
        <label className="block">Producto existente<Select value={row.productId} onChange={(event) => {
          const product = catalogue.find((item) => item.id === event.target.value);
          edit({ productId: event.target.value, ...(product == null ? {} : { name: product.name, unitId: product.unitId ?? "" }) });
        }}><option value="">Crear producto nuevo</option>{catalogue.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></label>
        <label className="block">Nombre confirmado<Input value={row.name} maxLength={200} disabled={row.productId !== ""} onChange={(event) => { edit({ name: event.target.value }); }} /></label>
        <label className="block">¿En qué heladera va?<Select value={row.fridgeId} onChange={(event) => { edit({ fridgeId: event.target.value }); }}><option value="">Elegí una heladera</option>{fridges.map((item) => <option key={item.id} value={item.id}>Heladera {item.number}{item.name == null ? "" : ` · ${item.name}`}</option>)}</Select></label>
        {fridges.length === 0 && <Link href="/inventory" className="underline">Creá una heladera para continuar</Link>}
        <label className="block">Unidad de inventario<Select value={row.unitId} disabled={row.productId !== ""} onChange={(event) => { edit({ unitId: event.target.value }); }}><option value="">Confirmá la unidad</option>{units.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></label>
        <div className="flex flex-wrap gap-2"><Button disabled={row.name.trim() === "" || row.fridgeId === "" || row.unitId === ""} onClick={() => { finish("reviewed"); }}>Revisado · siguiente</Button><Button variant="secondary" onClick={() => { finish("skipped"); }}>Dejar pendiente</Button></div>
      </>}
      <div className="flex gap-2"><Button variant="secondary" disabled={index === 0} onClick={() => { setIndex(index - 1); }}>Anterior</Button><Button variant="secondary" disabled={index === rows.length - 1} onClick={() => { setIndex(index + 1); }}>Siguiente</Button></div>
      <details><summary className="cursor-pointer">Todos los posibles productos</summary><div className="space-y-2">{rows.map((item, i) => <button type="button" key={item.id} className="block w-full rounded-xl border p-3 text-left" onClick={() => { setIndex(i); }}>{item.name} · {({ pending: "Pendiente", reviewed: "Revisado", skipped: "Pendiente", saved: "Agregado" })[item.status]}</button>)}</div></details>
    </fieldset>}
    {reviewed.length > 0 && <section className="app-card space-y-3 rounded-2xl p-4"><h2 className="font-semibold">Confirmar {reviewed.length} revisados</h2><ul>{reviewed.map((item) => <li key={item.id}>{item.name} → Heladera {fridges.find((fridge) => fridge.id === item.fridgeId)?.number} · {units.find((unit) => unit.id === item.unitId)?.name}</li>)}</ul><Button disabled={busy || !ready} onClick={() => { void save(); }}>Agregar lote al catálogo</Button></section>}
  </main>;
}
