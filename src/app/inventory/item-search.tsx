"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactElement, useId, useState } from "react";

import { Input } from "@/components/ui/input";
import type { ItemSuggestion } from "@/lib/queries/inventory-items";

function normalized(value: string): string { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().trim(); }

export function ItemSearch({ items }: { items: ItemSuggestion[] }): ReactElement {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(0);
  const term = normalized(query);
  const matches = term === "" ? [] : items.filter((item) => normalized(item.name).includes(term)).slice(0, 10);
  const visible = open && term !== "";
  return <div className="relative" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <label className="mb-2 flex items-center gap-2 text-sm font-medium" htmlFor={`${listId}-input`}><MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />Buscar producto</label>
    <Input id={`${listId}-input`} role="combobox" aria-autocomplete="list" aria-expanded={visible} aria-controls={listId} aria-activedescendant={visible && matches[selected] != null ? `${listId}-${selected}` : undefined} placeholder="Nombre del producto…" autoComplete="off" value={query} onFocus={() => { setOpen(true); }} onChange={(event) => { setQuery(event.target.value); setSelected(0); setOpen(true); }} onKeyDown={(event) => {
      if (event.key === "Escape") { setOpen(false); return; }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault(); setOpen(true);
        setSelected((index) => matches.length === 0 ? 0 : (index + (event.key === "ArrowDown" ? 1 : -1) + matches.length) % matches.length);
      }
      if (event.key === "Enter" && visible) {
        event.preventDefault();
        const item = matches[selected];
        if (item != null) { setOpen(false); router.push(`/inventory/items/${item.id}`); }
      }
    }} />
    {visible && <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
      {matches.length === 0 ? <p role="status" className="p-4 text-sm text-muted">No hay productos que coincidan.</p> : <ul id={listId} role="listbox" aria-label="Productos encontrados">{matches.map((item, index) => <li key={item.id} id={`${listId}-${index}`} role="option" aria-selected={index === selected} className={index === selected ? "bg-zinc-100" : ""}><Link className="block px-4 py-3 text-sm hover:bg-zinc-100" href={`/inventory/items/${item.id}`} onClick={() => { setOpen(false); }}>{item.name}</Link></li>)}</ul>}
    </div>}
  </div>;
}
