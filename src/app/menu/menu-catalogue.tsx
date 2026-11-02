"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactElement, useState } from "react";

import { FormMessage } from "@/components/form-feedback";
import { useActionForm } from "@/components/hooks/use-action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { saveMenuSection } from "@/lib/actions/menu";
import { getFormString } from "@/lib/form";
import type { MenuItemRow } from "@/lib/types/menu";

import { MenuForm } from "./menu-form";

interface Section { id: string; name: string; menuName: string; sortOrder: number }
function SectionEditor({ section, menuName }: { section?: Section; menuName: string }): ReactElement {
  const router = useRouter();
  const { error, isSubmitting, runAction } = useActionForm();
  async function save(form: HTMLFormElement): Promise<void> {
    const data = new FormData(form);
    const result = await runAction(() => saveMenuSection(section?.id ?? null, { name: getFormString(data, "name"), menuName, sortOrder: Number(getFormString(data, "order")) }));
    if (result.ok) { if (section === undefined) form.reset(); router.refresh(); }
  }
  return <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); void save(event.currentTarget); }}>
    <div className="flex flex-wrap gap-2">
      <Input aria-label="Nombre de sección" className="min-w-0 flex-1" name="name" required defaultValue={section?.name ?? ""} placeholder="Nueva sección" />
      <Input aria-label="Orden de sección" className="w-20!" name="order" type="number" min="0" max="10000" defaultValue={section?.sortOrder ?? 0} />
      <Button type="submit" busy={isSubmitting}>{section === undefined ? "Agregar sección" : "Guardar sección"}</Button>
    </div><FormMessage message={error} />
  </form>;
}
export function MenuCatalogue({ items, sections }: { items: MenuItemRow[]; sections: Section[] }): ReactElement {
  const [selected, setSelected] = useState("Don Juan");
  const [search, setSearch] = useState("");
  const editions = [...new Set(["Don Juan", "Genüsse", ...sections.map((section) => section.menuName), ...(items.some((item) => item.sectionId === null) ? ["Sin clasificar"] : [])])];
  const normalize = (value: string): string => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const current = items.filter((item) => (selected === "Sin clasificar" ? item.sectionId === null : item.menuName === selected) && normalize(item.name).includes(normalize(search)));
  const groups = sections.filter((section) => section.menuName === selected);
  return <div className="app-page max-w-4xl">
    <PageHeader title="Catálogo de Menú" backHref="/" backLabel="Inicio" actions={<Link href="/menu/new" className="rounded-xl border px-3 py-3 text-sm">Agregar ítem</Link>} />
    <main className="space-y-5 py-5">
      <p className="text-sm text-muted">Cartas, secciones, descripciones, tamaños y precios de venta. Este catálogo es independiente del inventario.</p>
      <nav className="flex flex-wrap gap-2">{editions.map((edition) => <button key={edition} type="button" aria-pressed={edition === selected} onClick={() => { setSelected(edition); }} className={`min-h-11 rounded-xl border px-4 text-sm ${  edition === selected ? "bg-slate-800 text-white" : ""}`}>{edition}</button>)}</nav>
      <label className="block"><span className="sr-only">Buscar ítem de menú</span><Input type="search" placeholder="Buscar ítem…" value={search} onChange={(event) => { setSearch(event.target.value); }} /></label>
      <p role="status" className="text-sm">{current.length} ítems · {current.filter((item) => item.reviewNote !== null || (item.sellPrice === null && item.priceOptions.length === 0) || item.priceOptions.some((option) => option.price === null)).length} para revisar</p>
      {[...groups, ...(selected === "Sin clasificar" ? [{ id: "", name: "Sin clasificar", menuName: selected, sortOrder: 0 }] : [])].map((section) => {
        const rows = current.filter((item) => (item.sectionId ?? "") === section.id);
        if (search !== "" && rows.length === 0) return null;
        return <section key={section.id} className="overflow-hidden rounded-2xl border">
          <header className="flex items-center justify-between gap-3 bg-slate-50 px-4 py-3"><h2 className="text-lg font-bold">{section.name}</h2><span className="text-xs text-muted">{rows.length}</span></header>
          {section.id !== "" && <details className="border-b p-3"><summary className="text-sm">Editar sección y orden</summary><SectionEditor section={section} menuName={selected} /></details>}
          <div className="divide-y">{rows.map((item) => <details key={item.id}><summary className="block cursor-pointer p-4 hover:bg-slate-50">
            <div className="flex justify-between gap-3"><h3 className="font-semibold">{item.name}</h3><span className="shrink-0 text-sm">{item.sellPrice === null ? item.priceOptions.length === 0 ? "Precio pendiente" : "Ver opciones" : `$${  item.sellPrice}`}</span></div>
            {item.description !== null && <p className="mt-1 whitespace-pre-line text-sm text-muted">{item.description}</p>}
            {item.priceOptions.length > 0 && <p className="mt-1 text-sm">{item.priceOptions.map((option) => `${option.label  }: ${  option.price === null ? "pendiente" : `$${  option.price}`}`).join(" · ")}</p>}
            {item.reviewNote !== null && <p className="mt-1 text-xs text-amber-800">Revisar: {item.reviewNote}</p>}
          </summary><div className="border-t p-4"><MenuForm item={item} sections={sections} /></div></details>)}</div>
          {rows.length === 0 && <p className="p-4 text-sm text-muted">Sin ítems en esta sección.</p>}
        </section>;
      })}
      {selected !== "Sin clasificar" && <details className="rounded-xl border p-4"><summary>Agregar sección a {selected}</summary><SectionEditor menuName={selected} /></details>}
    </main>
  </div>;
}
