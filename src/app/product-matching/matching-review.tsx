"use client";

import { type ReactElement, useMemo, useState, useTransition } from "react";

import { reviewProductMatch } from "@/lib/actions/product-matching";
import { type CatalogueProduct, type MatchDecision, type MatchProduct, normalizeMatchName, suggestMatch } from "@/lib/product-matching";

interface Props { inventory: MatchProduct[]; catalogue: CatalogueProduct[]; decisions: MatchDecision[] }
export function MatchingReview({ inventory, catalogue, decisions: initial }: Props): ReactElement {
  const [decisions, setDecisions] = useState(initial);
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [manual, setManual] = useState<string | null>(null);
  const [candidateSearch, setCandidateSearch] = useState("");
  const [error, setError] = useState("");
  const [busy, startTransition] = useTransition();
  const rows = useMemo(() => inventory.map(item => {
    const candidates = catalogue.map(candidate => {
      const suggestion = suggestMatch(item, candidate);
      const decision = decisions.find(d => d.inventoryId === item.id && d.catalogueId === candidate.id);
      return { candidate, suggestion, status: decision?.status ?? (suggestion?.exact === true ? "automatic" : "suggested") };
    });
    const accepted = candidates.filter(c => c.status === "accepted");
    const automatic = candidates.filter(c => c.status === "automatic");
    const suggested = candidates.filter(c => c.suggestion !== null && c.status === "suggested");
    const category = accepted.length ? "reviewed" : automatic.length ? "automatic" : suggested.length ? "pending" : "unmatched";
    return { item, candidates, category };
  }), [inventory, catalogue, decisions]);
  function save(inventoryId: string, catalogueId: string, status: "accepted" | "rejected"): void {
    setError("");
    startTransition(async () => {
      try {
        const result = await reviewProductMatch({ inventoryId, catalogueId, status });
        if (!result.ok) { setError(result.error); return; }
        setDecisions(previous => [...previous.filter(d => !(d.inventoryId === inventoryId && d.catalogueId === catalogueId)), { inventoryId, catalogueId, status }]);
      } catch { setError("No se pudo guardar. Intentá nuevamente."); }
    });
  }
  const visible = rows.filter(row => (filter === "all" || row.category === filter) && normalizeMatchName(row.item.name).includes(normalizeMatchName(search)));
  const linked = new Set(rows.flatMap(r => r.candidates.filter(c => c.status === "accepted" || c.status === "automatic").map(c => c.candidate.id)));
  return <div className="space-y-5">
    <p className="rounded-xl bg-blue-50 p-4 text-sm text-blue-900">Esto guarda equivalencias de nombres. No cambia cantidades, precios ni proveedores. Podés confirmar varias alternativas por producto y deshacerlas después. Una equivalencia no indica quién suministró el stock actual.</p>
    <div className="flex flex-wrap gap-2" aria-label="Estado de revisión">{[["pending", "Sugerencias"], ["automatic", "Automáticos"], ["unmatched", "Sin sugerencia"], ["reviewed", "Revisados"], ["all", "Todos"]].map(([value, label]) => <button key={value} onClick={() => { setFilter(value ?? "all"); }} aria-pressed={filter === value} className={`rounded-full border px-4 py-2 text-sm ${filter === value ? "bg-slate-900 text-white" : "bg-white"}`}>{label} · {value === "all" ? rows.length : rows.filter(r => r.category === value).length}</button>)}</div>
    <input aria-label="Buscar en inventario" placeholder="Buscar un nombre del inventario…" value={search} onChange={e => { setSearch(e.target.value); }} className="w-full rounded-xl border bg-white p-3" />
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-800">{error}</p>}
    {visible.length === 0 && <p className="p-6 text-slate-500">No hay productos en esta vista. Podés cambiar de sección o buscar otro nombre.</p>}
    {visible.map(({ item, candidates, category }) => <section key={item.id} className="rounded-2xl border bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-slate-500">Inventario · {item.unit}</p><h2 className="text-xl font-bold">{item.name}</h2><p className="text-sm text-slate-500">{category === "unmatched" ? "Sin una sugerencia segura. Buscá y elegí manualmente." : "Compará nombres y presentaciones antes de confirmar."}</p></div><button className="rounded-xl border px-3 py-2" onClick={() => { setManual(manual === item.id ? null : item.id); setCandidateSearch(""); }}>Buscar / cambiar</button></div>
      {manual === item.id && <input autoFocus aria-label={`Buscar catálogo para ${item.name}`} placeholder="Nombre, proveedor o variante…" className="mt-4 w-full rounded-xl border p-3" value={candidateSearch} onChange={e => { setCandidateSearch(e.target.value); }} />}
      <div className="mt-4 space-y-3">{candidates.filter(c => manual === item.id ? normalizeMatchName(`${c.candidate.name} ${c.candidate.provider}`).includes(normalizeMatchName(candidateSearch)) : c.status !== "rejected" && (c.suggestion !== null || c.status === "accepted")).map(({ candidate, suggestion, status }) => <div key={candidate.id} className="rounded-xl border bg-slate-50 p-3">
        <p className="font-semibold">{candidate.name}</p><p className="text-sm text-slate-600">{candidate.provider} · {candidate.unit}</p>
        <p className="mt-2 text-sm">{status === "accepted" ? "✓ Confirmado por vos" : status === "rejected" ? "Descartado por vos" : status === "automatic" ? "Vínculo automático · pendiente de revisión" : "Posible equivalencia"}</p>
        <p className="text-sm text-slate-500">{suggestion?.reason ?? "Selección manual del catálogo."}{item.unit !== candidate.unit && " Las unidades son distintas; no se convierten cantidades."}</p>
        <div className="mt-3 flex flex-wrap gap-2"><button disabled={busy || status === "accepted"} onClick={() => { save(item.id, candidate.id, "accepted"); }} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm text-white disabled:opacity-50">{status === "accepted" ? "Confirmado" : status === "rejected" ? "Volver a vincular" : "Sí, corresponde"}</button>
        {status !== "rejected" && <button disabled={busy} onClick={() => { save(item.id, candidate.id, "rejected"); }} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50">{status === "accepted" || status === "automatic" ? "Deshacer vínculo" : "No corresponde"}</button>}</div>
      </div>)}</div>
    </section>)}
    <details className="rounded-2xl border bg-white p-5"><summary className="cursor-pointer font-semibold">Catálogo sin equivalencia · {catalogue.filter(c => !linked.has(c.id)).length}</summary><p className="my-3 text-sm text-slate-500">No hace falta resolver todo. Para unir uno de estos productos, buscá el nombre del inventario en «Todos» y usá «Buscar / cambiar».</p><ul className="space-y-2">{catalogue.filter(c => !linked.has(c.id)).map(c => <li key={c.id} className="text-sm">{c.name} <span className="text-slate-500">· {c.provider}</span></li>)}</ul></details>
  </div>;
}
