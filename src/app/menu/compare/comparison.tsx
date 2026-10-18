"use client";

import { type ReactElement,useState } from "react";

import { Input } from "@/components/ui/input";
import { FilterButton } from "@/components/ui/tabs";
import { compareMenus, type MenuDocument } from "@/lib/menu/versions";

type Item = MenuDocument["items"][number];
function ItemSnapshot({ item, document, label }: { item?: Item; document: MenuDocument; label: string }): ReactElement {
  return <div className="min-w-0 space-y-2 rounded-xl bg-zinc-50 p-3">
    <h3 className="text-xs font-semibold uppercase text-muted">{label}</h3>
    {item === undefined ? <p className="text-sm text-muted">No está en esta versión.</p> : <>
      <p className="break-words font-semibold">{item.name}</p>
      <p className="text-xs text-muted">{document.sections.find(section => section.id === item.sectionId)?.name ?? "Sin sección"} · Orden: {item.sortOrder}</p>
      <p className="text-sm">Precio: {item.sellPrice === null ? "Pendiente" : `$${item.sellPrice}`}</p>
      {item.priceOptions.map(option => <p key={option.label} className="text-sm">{option.label}: {option.price === null ? "Pendiente" : `$${option.price}`}</p>)}
      <p className="whitespace-pre-wrap break-words text-sm">{item.description ?? "Sin descripción"}</p>
      {item.reviewNote !== null && <p className="text-sm text-amber-800">Nota: {item.reviewNote}</p>}
    </>}
  </div>;
}

export function MenuComparison({ previous, current }: { previous: MenuDocument; current: MenuDocument }): ReactElement {
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");
  const changes = compareMenus(previous, current);
  const labels = { new: "Agregado al menú actual", removed: "Quitado del menú actual", changed: "Modificado", unchanged: "Sin cambios" };
  const visible = changes.filter(change => (showAll || change.kind !== "unchanged") && `${change.name} ${previous.items.find(item => item.id === change.id)?.name ?? ""}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  const sectionsChanged = JSON.stringify(previous.sections) !== JSON.stringify(current.sections);
  return <div className="space-y-4">
    <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{changes.filter(change => change.kind === "new").length} agregados · {changes.filter(change => change.kind === "removed").length} quitados · {changes.filter(change => change.kind === "changed").length} modificados · {changes.filter(change => change.kind === "unchanged").length} sin cambios</p>
    <div className="flex gap-2"><FilterButton selected={!showAll} onClick={() => { setShowAll(false); }}>Solo cambios</FilterButton><FilterButton selected={showAll} onClick={() => { setShowAll(true); }}>Todos los ítems</FilterButton></div>
    <Input type="search" aria-label="Buscar en la comparación" placeholder="Buscar ítem…" value={search} onChange={event => { setSearch(event.target.value); }} />
    {sectionsChanged && <section className="space-y-2 rounded-xl border p-3"><h2 className="font-semibold">Secciones y orden modificados</h2><p className="text-sm">Histórico: {[...previous.sections].sort((a,b) => a.sortOrder-b.sortOrder).map(section => section.name).join(" · ") || "Sin secciones"}</p><p className="text-sm">Actual: {[...current.sections].sort((a,b) => a.sortOrder-b.sortOrder).map(section => section.name).join(" · ") || "Sin secciones"}</p></section>}
    {visible.map(change => <section key={change.id} className="space-y-3 rounded-2xl border p-4">
      <h2 className="font-semibold">{change.name} · {labels[change.kind]}</h2>
      {change.details.length > 0 && <ul className="space-y-1 text-sm text-muted">{change.details.map((detail, index) => <li key={index}>{detail}</li>)}</ul>}
      <div className="grid gap-3 sm:grid-cols-2"><ItemSnapshot item={previous.items.find(item => item.id === change.id)} document={previous} label="Histórico · antes" /><ItemSnapshot item={current.items.find(item => item.id === change.id)} document={current} label="Actual · ahora" /></div>
    </section>)}
    {visible.length === 0 && <p className="text-sm text-muted">{search !== "" ? "No hay ítems que coincidan." : sectionsChanged ? "No hay cambios en los ítems." : "No hay cambios entre estas versiones."}</p>}
  </div>;
}
