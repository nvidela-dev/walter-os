"use client";

import { type ReactElement, useMemo, useState, useTransition } from "react";

import { reviewProductMatch, setProductArchived } from "@/lib/actions/product-matching";
import { type CatalogueProduct, type MatchDecision, type MatchProduct, normalizeMatchName, suggestMatch } from "@/lib/product-matching";

interface Props { inventory: MatchProduct[]; catalogue: CatalogueProduct[]; decisions: MatchDecision[] }
const filters = [["all", "todos"], ["automatic", "auto"], ["pending", "sugeridos"], ["unmatched", "sin vínculo"], ["reviewed", "revisados"], ["archived", "archivados"]] as const;
export function MatchingReview({ inventory, catalogue, decisions: initial }: Props): ReactElement {
  const [decisions, setDecisions] = useState(initial);
  const [archived, setArchived] = useState(() => new Set([...inventory, ...catalogue].filter(p => p.deletedAt != null).map(p => p.id)));
  const [direction, setDirection] = useState<"inventory" | "catalogue">("inventory");
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [manual, setManual] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [lastArchive, setLastArchive] = useState<MatchProduct | null>(null);
  const [busy, startTransition] = useTransition();
  const rows = useMemo(() => {
    const sources = direction === "inventory" ? inventory : catalogue;
    return sources.map(item => {
      const candidates = (direction === "inventory" ? catalogue : inventory).filter(p => !archived.has(p.id)).map(candidate => {
        const inventoryId = direction === "inventory" ? item.id : candidate.id;
        const catalogueId = direction === "inventory" ? candidate.id : item.id;
        const supplier = catalogue.find(p => p.id === catalogueId);
        const source = inventory.find(p => p.id === inventoryId);
        const suggestion = source === undefined || supplier === undefined ? null : suggestMatch(source, supplier);
        const decision = decisions.find(d => d.inventoryId === inventoryId && d.catalogueId === catalogueId);
        return { candidate, inventoryId, catalogueId, suggestion, status: decision?.status ?? (suggestion?.exact === true ? "automatic" : "suggested") };
      });
      const category = archived.has(item.id) ? "archived" : candidates.some(c => c.status === "accepted") ? "reviewed" : candidates.some(c => c.status === "automatic") ? "automatic" : candidates.some(c => c.suggestion !== null && c.status === "suggested") ? "pending" : "unmatched";
      return { item, candidates, category };
    });
  }, [inventory, catalogue, direction, decisions, archived]);
  const visible = rows.filter(r => (filter === "all" ? r.category !== "archived" : r.category === filter) && normalizeMatchName(`${r.item.name} ${"provider" in r.item ? String(r.item.provider) : ""} ${r.item.id}`).includes(normalizeMatchName(search)));
  const active = visible.find(r => r.item.id === selected) ?? visible[0];
  const candidates = active?.candidates.filter(c => manual || candidateSearch.length > 0 ? normalizeMatchName(`${c.candidate.name} ${"provider" in c.candidate ? String(c.candidate.provider) : ""} ${c.candidate.id}`).includes(normalizeMatchName(candidateSearch)) : c.status !== "rejected" && (c.suggestion !== null || c.status === "accepted")) ?? [];
  function choose(id: string): void { setSelected(id); setCandidateSearch(""); setManual(false); }
  function save(inventoryId: string, catalogueId: string, status: "accepted" | "rejected"): void {
    setError(""); setMessage("");
    startTransition(async () => {
      try {
        const result = await reviewProductMatch({ inventoryId, catalogueId, status });
        if (!result.ok) { setError(result.error); return; }
        setDecisions(previous => [...previous.filter(d => !(d.inventoryId === inventoryId && d.catalogueId === catalogueId)), { inventoryId, catalogueId, status }]);
        setMessage(status === "accepted" ? "Vínculo confirmado." : "Vínculo descartado.");
      } catch { setError("No se pudo guardar. Reintentá."); }
    });
  }
  function archive(item: MatchProduct, value: boolean): void {
    setError(""); setMessage("");
    startTransition(async () => {
      try {
        const result = await setProductArchived({ productId: item.id, archived: value });
        if (!result.ok) { setError(result.error); return; }
        setArchived(previous => { const next = new Set(previous); if (value) next.add(item.id); else next.delete(item.id); return next; });
        setLastArchive(value ? item : null);
        setMessage(`${item.name}: ${value ? "archivado" : "restaurado"}.`);
      } catch { setError("No se pudo guardar. Reintentá."); }
    });
  }
  return <div className="matching-console" aria-busy={busy}>
    <div className="mc-toolbar">
      <button aria-pressed={direction === "inventory"} onClick={() => { setDirection("inventory"); choose(""); }}>inventario → catálogo</button>
      <button aria-pressed={direction === "catalogue"} onClick={() => { setDirection("catalogue"); choose(""); }}>catálogo → inventario</button>
      <span className="mc-muted">{busy ? "guardando…" : "listo"}</span>
    </div>
    <div className="mc-toolbar">{filters.map(([value, label]) => <button key={value} aria-pressed={filter === value} onClick={() => { setFilter(value); }}>{label} [{value === "all" ? rows.filter(r => r.category !== "archived").length : rows.filter(r => r.category === value).length}]</button>)}</div>
    <div className="mc-toolbar"><span>/</span><input aria-label="Buscar lista" placeholder="nombre / proveedor / ID" value={search} onChange={e => { setSearch(e.target.value); }} /><span>{visible.length} filas</span></div>
    {error !== "" && <div role="alert" className="mc-error">ERROR: {error}</div>}
    {message !== "" && <div role="status" className="mc-toolbar">{message}{lastArchive !== null && <button disabled={busy} onClick={() => { archive(lastArchive, false); }}>deshacer archivo</button>}</div>}
    <div className="mc-panels">
      <div className="mc-list"><table><thead><tr><th>producto / ID</th><th>unidad</th><th>estado</th><th>acción</th></tr></thead><tbody>{visible.map(({ item, category }) => <tr key={item.id} aria-selected={active?.item.id === item.id}>
        <td><button className="mc-name" onClick={() => { choose(item.id); }}>{item.name}</button><small title={item.id}>{item.id.slice(0, 8)}{"provider" in item ? ` · ${String(item.provider)}` : ""}</small></td><td>{item.unit}</td><td>{filters.find(f => f[0] === category)?.[1]}</td><td><button disabled={busy} aria-label={`${category === "archived" ? "Restaurar" : "Archivar"} ${item.name}`} onClick={() => { archive(item, category !== "archived"); }}>{category === "archived" ? "restore" : "archive"}</button></td>
      </tr>)}</tbody></table>{visible.length === 0 && <p className="mc-muted mc-empty">0 resultados</p>}</div>
      <div className="mc-detail">
        <div className="mc-toolbar"><strong>{active?.item.name ?? "Sin selección"}</strong><span className="mc-muted">{active?.item.id.slice(0, 8)}</span></div>
        {active !== undefined && active.category !== "archived" && <>
          <div className="mc-toolbar"><input aria-label="Buscar coincidencia" placeholder={direction === "inventory" ? "buscar nombre / proveedor / ID" : "buscar inventario / ID"} value={candidateSearch} onChange={e => { setCandidateSearch(e.target.value); }} /><button aria-pressed={manual} onClick={() => { setManual(!manual); }}>catálogo completo</button></div>
          <div className="mc-candidates"><table><thead><tr><th>equivalencia</th><th>estado</th><th>comandos</th></tr></thead><tbody>{candidates.map(({ candidate, inventoryId, catalogueId, suggestion, status }) => <tr key={candidate.id}>
            <td><strong>{candidate.name}</strong><small>{"provider" in candidate ? String(candidate.provider) : "inventario"} · {candidate.unit} · <span title={candidate.id}>{candidate.id.slice(0, 8)}</span></small><small>{suggestion?.reason ?? "Selección manual"}{active.item.unit !== candidate.unit ? " · unidades distintas" : ""}</small></td>
            <td><span className={status === "accepted" ? "mc-ok" : "mc-muted"}>{status === "accepted" ? "confirmado" : status === "rejected" ? "descartado" : status === "automatic" ? "auto / revisar" : "sugerido"}</span></td>
            <td><div className="mc-commands"><button disabled={busy || status === "accepted"} aria-label={`Confirmar ${candidate.name}`} onClick={() => { save(inventoryId, catalogueId, "accepted"); }}>match</button><button disabled={busy || status === "rejected"} aria-label={`Descartar ${candidate.name}`} onClick={() => { save(inventoryId, catalogueId, "rejected"); }}>reject</button><button disabled={busy} aria-label={`Archivar ${candidate.name}`} onClick={() => { archive(candidate, true); }}>archive</button></div></td>
          </tr>)}</tbody></table>{candidates.length === 0 && <p className="mc-muted mc-empty">Sin candidatos. Buscar o abrir catálogo completo.</p>}</div>
        </>}
        {active?.category === "archived" && <p className="mc-muted mc-empty">Archivado globalmente. Restore recupera el producto y sus vínculos.</p>}
      </div>
    </div>
    <div className="mc-footer">match = confirmar · reject = descartar par · archive = ocultar producto globalmente · historial conservado</div>
  </div>;
}
