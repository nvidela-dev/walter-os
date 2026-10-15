"use client";
import Link from "next/link";
import { type ReactElement, useState } from "react";

import { Input } from "@/components/ui/input";
import type { menuVersions } from "@/db/schema";

export function ActiveMenuCatalogue({menus}: {menus: (typeof menuVersions.$inferSelect)[]}): ReactElement {
  const [selected,setSelected] = useState(menus[0]?.menuName ?? "Don Juan");
  const [search,setSearch] = useState("");
  const current = menus.find(menu => menu.menuName === selected);
  return <section className="space-y-4" aria-label="Menús activos">
    <nav className="flex gap-2" aria-label="Carta activa">{menus.map(menu => <button key={menu.id} type="button" aria-pressed={selected === menu.menuName} onClick={() => {setSelected(menu.menuName);setSearch("");}} className={`min-h-11 rounded-xl border px-4 font-semibold ${selected === menu.menuName ? "bg-emerald-700 text-white" : ""}`}>{menu.menuName}</button>)}</nav>
    {current ? <>
      <div className="rounded-xl bg-emerald-50 p-4"><p className="text-xs font-bold uppercase text-emerald-800">Menú activo</p><h2 className="text-xl font-bold">{current.menuName}</h2><p className="text-sm text-muted">{current.document.items.length} ítems · Desde {current.submittedAt?.toLocaleString("es-UY",{timeZone:"America/Montevideo"})}</p></div>
      <label className="block"><span className="sr-only">Buscar en menú activo</span><Input type="search" placeholder="Buscar ítem…" value={search} onChange={event => {setSearch(event.target.value);}}/></label>
      {[...current.document.sections].sort((a,b) => a.sortOrder-b.sortOrder).map(section => {
        const items = current.document.items.filter(item => item.sectionId === section.id && item.name.toLocaleLowerCase().includes(search.toLocaleLowerCase())).sort((a,b) => a.sortOrder-b.sortOrder || a.name.localeCompare(b.name));
        if (search !== "" && items.length === 0) return null;
        return <section key={section.id} className="overflow-hidden rounded-xl border border-slate-200"><h3 className="bg-slate-50 px-4 py-3 font-bold">{section.name}</h3><div className="divide-y divide-slate-200">{items.map(item => <div key={item.id} className="space-y-1 p-4"><div className="flex justify-between gap-3"><p className="font-semibold">{item.name}</p><p className="shrink-0 text-sm">{item.sellPrice === null ? item.priceOptions.length > 0 ? "Ver opciones" : "Precio pendiente" : `$${item.sellPrice}`}</p></div>{item.description !== null && <p className="whitespace-pre-line text-sm text-muted">{item.description}</p>}{item.priceOptions.length > 0 && <p className="text-sm">{item.priceOptions.map(option => `${option.label}: ${option.price === null ? "Pendiente" : `$${option.price}`}`).join(" · ")}</p>}{item.reviewNote !== null && <p className="text-xs text-amber-800">Revisar: {item.reviewNote}</p>}</div>)}</div></section>;
      })}
      <Link href={`/menu/versions/${current.id}`} className="inline-block py-2 text-sm underline">Ver versión activa</Link>
    </> : <p>Todavía no hay un menú activo. Creá y presentá un nuevo menú.</p>}
  </section>;
}
