"use client";

import { type ReactElement, useMemo, useState, useTransition } from "react";

import { archiveDuplicate } from "@/lib/actions/product-duplicates";
import { setProductArchived } from "@/lib/actions/product-matching";
import { type DuplicateProduct, suggestDuplicate } from "@/lib/product-duplicates";
import { type MatchDecision, normalizeMatchName } from "@/lib/product-matching";

interface Props { products: DuplicateProduct[]; decisions: MatchDecision[] }
export function DuplicateReview({ products, decisions }: Props): ReactElement {
  const [archived, setArchived] = useState(() => new Set(products.filter(p => p.deletedAt !== null).map(p => p.id)));
  const [filter, setFilter] = useState<"suggested" | "all" | "archived">("suggested");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [candidateSearch, setCandidateSearch] = useState("");
  const [manual, setManual] = useState(false);
  const [confirmation, setConfirmation] = useState<{ keep: DuplicateProduct; remove: DuplicateProduct } | null>(null);
  const [lastArchive, setLastArchive] = useState<DuplicateProduct | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, startTransition] = useTransition();
  const activeProducts = useMemo(() => products.filter(p => !archived.has(p.id)), [products, archived]);
  const rows = useMemo(() => products.map(item => ({ item, candidates: archived.has(item.id) ? [] : activeProducts.flatMap(candidate => {
    const suggestion = suggestDuplicate({ ...item, deletedAt: null }, { ...candidate, deletedAt: null });
    const rejected = decisions.some(d => d.status === "rejected" && ((d.inventoryId === item.id && d.catalogueId === candidate.id) || (d.inventoryId === candidate.id && d.catalogueId === item.id)));
    return suggestion !== null && !rejected ? [{ candidate, ...suggestion }] : [];
  }).sort((a, b) => b.score - a.score) })), [products, archived, activeProducts, decisions]);
  const searchable = (p: DuplicateProduct): string => normalizeMatchName(`${p.name} ${p.id} ${p.providers.map(v => v.name).join(" ")}`);
  const visible = rows.filter(({ item, candidates }) => (filter === "archived" ? archived.has(item.id) : !archived.has(item.id) && (filter === "all" || candidates.length > 0)) && searchable(item).includes(normalizeMatchName(search)));
  const source = visible.find(r => r.item.id === selected) ?? visible[0];
  const candidates = source === undefined || archived.has(source.item.id) ? [] : manual || candidateSearch !== "" ? activeProducts.filter(p => p.id !== source.item.id && searchable(p).includes(normalizeMatchName(candidateSearch))) : source.candidates.map(c => c.candidate);
  const candidate = candidates.find(p => p.id === candidateId) ?? candidates[0];
  function choose(id: string): void { setSelected(id); setCandidateId(null); setCandidateSearch(""); setManual(false); setConfirmation(null); }
  function restore(item: DuplicateProduct): void {
    setError("");
    startTransition(async () => {
      try {
        const result = await setProductArchived({ productId: item.id, archived: false });
        if (!result.ok) { setError(result.error); return; }
        setArchived(previous => { const next = new Set(previous); next.delete(item.id); return next; });
        setMessage(`${item.name}: restaurado.`); setLastArchive(null);
      } catch { setError("No se pudo restaurar. Reintentá."); }
    });
  }
  function commit(): void {
    if (confirmation === null) return;
    const pair = confirmation;
    setError("");
    startTransition(async () => {
      try {
        const result = await archiveDuplicate({ keepId: pair.keep.id, archiveId: pair.remove.id });
        if (!result.ok) { setError(result.error); return; }
        setArchived(previous => new Set([...previous, pair.remove.id]));
        setLastArchive(pair.remove); setConfirmation(null); setCandidateId(null);
        setMessage(`Se conservó ${pair.keep.name} (${pair.keep.id.slice(0, 8)}) y se archivó ${pair.remove.name} (${pair.remove.id.slice(0, 8)}).`);
      } catch { setError("No se pudo guardar. Reintentá."); }
    });
  }
  function card(item: DuplicateProduct, label: string): ReactElement {
    return <section className="mc-duplicate-card" aria-label={label}><h2>{label}: {item.name}</h2><small>{item.id}</small><p>Unidad: <strong>{item.unit}</strong></p><p>Proveedor: {item.providers.map(p => `${p.name.trim()}${p.price === null ? "" : ` ($${p.price})`}`).join(", ") || "sin vínculo"}</p><p>Heladeras: {item.placements.map(p => `${p.number}${p.active ? "" : " (inactiva)"}${p.note != null && p.note !== "" ? ` · ${p.note}` : ""}`).join("; ") || "sin ubicación"}</p><p>{item.observations} registros de conteo · {item.invoices} líneas de factura</p><p>Últimos conteos: {(item.latestCounts ?? []).map(c => `heladera ${c.number}: ${c.quantity} ${c.unit} (${new Date(c.recordedAt).toLocaleDateString("es-UY", { timeZone: "America/Montevideo" })})`).join("; ") || "sin conteos de cocina"}</p><p>Creado: {new Date(item.createdAt).toLocaleString("es-UY", { timeZone: "America/Montevideo" })}</p></section>;
  }
  const rejectedPair = source !== undefined && candidate !== undefined && decisions.some(d => d.status === "rejected" && ((d.inventoryId === source.item.id && d.catalogueId === candidate.id) || (d.inventoryId === candidate.id && d.catalogueId === source.item.id)));
  return <div className="matching-console" aria-busy={busy}>
    <p className="mc-empty">Compará dos registros y elegí cuál conservar. Archivar lo oculta de las listas activas y conserva su historial. Los conteos, ubicaciones y proveedores no se trasladan al otro registro.</p>
    <div className="mc-toolbar">{([ ["suggested", "posibles duplicados"], ["all", "todos"], ["archived", "archivados"] ] as const).map(([value, label]) => <button key={value} disabled={busy} aria-pressed={filter === value} onClick={() => { setFilter(value); choose(""); }}>{label}</button>)}<input aria-label="Buscar productos" placeholder="nombre / proveedor / ID" value={search} disabled={busy} onChange={e => { setSearch(e.target.value); setConfirmation(null); }} /><span>{visible.length} productos</span></div>
    {error && <p role="alert" className="mc-error">{error}</p>}
    {message && <div role="status" className="mc-toolbar">{message}{lastArchive && <button disabled={busy} onClick={() => { restore(lastArchive); }}>deshacer archivo</button>}</div>}
    <div className="mc-panels"><div className="mc-list"><table><thead><tr><th>producto</th><th>unidad / proveedor</th><th>posibles pares</th></tr></thead><tbody>{visible.map(({ item, candidates: suggestions }) => <tr key={item.id} aria-selected={source?.item.id === item.id}><td><button className="mc-name" disabled={busy} onClick={() => { choose(item.id); }}>{item.name}</button><small>{item.id.slice(0, 8)}</small></td><td>{item.unit}<small>{item.providers.map(p => p.name.trim()).join(", ")}</small></td><td>{archived.has(item.id) ? <button disabled={busy} aria-label={`Restaurar ${item.name}`} onClick={() => { restore(item); }}>restaurar</button> : suggestions.length}</td></tr>)}</tbody></table>{visible.length === 0 && <p className="mc-empty">No hay productos en esta vista.</p>}</div>
    <div className="mc-detail">{source !== undefined && !archived.has(source.item.id) && <>
      <div className="mc-toolbar"><input aria-label="Buscar segundo producto" placeholder="buscar nombre / proveedor / ID" disabled={busy} value={candidateSearch} onChange={e => { setCandidateSearch(e.target.value); setCandidateId(null); setConfirmation(null); }} /><button disabled={busy} aria-pressed={manual} onClick={() => { setManual(!manual); setConfirmation(null); }}>buscar en todos</button></div>
      <div className="mc-toolbar mc-duplicate-options">{candidates.map(p => <button key={p.id} disabled={busy} aria-pressed={candidate?.id === p.id} onClick={() => { setCandidateId(p.id); setConfirmation(null); }}>{p.name} · {p.id.slice(0, 8)}</button>)}</div>
      {candidate !== undefined ? <>
        <p className="mc-empty">{suggestDuplicate({ ...source.item, deletedAt: null }, { ...candidate, deletedAt: null })?.reason ?? "Selección manual: verificá que representen el mismo producto."}</p>
        {rejectedPair && <p className="mc-error">Este par fue descartado anteriormente en Unir nombres. Revisá esa decisión antes de archivar.</p>}
        <div className="mc-duplicate-cards">{card(source.item, "Primer producto")}{card(candidate, "Segundo producto")}</div>
        <div className="mc-toolbar"><button disabled={busy} onClick={() => { setConfirmation({ keep: source.item, remove: candidate }); }}>Conservar primero y archivar segundo</button><button disabled={busy} onClick={() => { setConfirmation({ keep: candidate, remove: source.item }); }}>Conservar segundo y archivar primero</button></div>
        {confirmation !== null && <section className="mc-empty" aria-label="Confirmar archivo"><p>Conservar: <strong>{confirmation.keep.name} · {confirmation.keep.id.slice(0, 8)}</strong></p><p>Archivar en toda la app: <strong>{confirmation.remove.name} · {confirmation.remove.id.slice(0, 8)}</strong></p><p>Su historial queda en el registro archivado. Podés restaurarlo desde Archivados.</p><div className="mc-toolbar"><button disabled={busy} onClick={commit}>{busy ? "guardando…" : "Confirmar archivo"}</button><button disabled={busy} onClick={() => { setConfirmation(null); }}>Cancelar</button></div></section>}
      </> : <p className="mc-empty">Sin sugerencias. Buscá otro producto para compararlo.</p>}
    </>}{source !== undefined && archived.has(source.item.id) && <>{card(source.item, "Archivado")}<p className="mc-empty">Restaurar recupera el mismo registro, sus vínculos y ubicaciones.</p></>}</div></div>
  </div>;
}
