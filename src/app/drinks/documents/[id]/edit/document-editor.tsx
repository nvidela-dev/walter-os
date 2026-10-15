"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactElement, useState } from "react";

import { FormMessage } from "@/components/form-feedback";
import { useActionForm } from "@/components/hooks/use-action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DrinkDocumentItem, drinkDocuments } from "@/db/schema";
import { saveDrinkDocument } from "@/lib/actions/drink-documents";
import { drinkDocumentHref } from "@/lib/drinks/documents";
export function DrinkDocumentEditor({document,items}:{document:typeof drinkDocuments.$inferSelect;items:DrinkDocumentItem[]}):ReactElement{
 const router=useRouter();const [values,setValues]=useState<Record<string,string>>(()=>Object.fromEntries(items.map(item=>[item.itemId,item.quantity??""])));const [search,setSearch]=useState("");const {error,isSubmitting,runAction}=useActionForm();const href=drinkDocumentHref(document.id,document.category,document.date);
 async function save():Promise<void>{const result=await runAction(()=>saveDrinkDocument(document.id,document.revision,items.map(item=>({itemId:item.itemId,unit:item.unit,quantity:(values[item.itemId]??"").trim()===""?null:values[item.itemId]}))));if(result.ok){router.push(href);router.refresh();}}
 return <main className="space-y-4 py-4"><h1 className="text-xl font-bold">Editar · {document.category} · {document.date}</h1><p className="text-sm text-muted">Vacío significa sin revisar; 0 significa que no queda nada. Guardar reemplaza las cantidades de este archivo.</p><label className="block"><span className="sr-only">Buscar bebida</span><Input type="search" placeholder="Buscar bebida…" value={search} onChange={event=>{setSearch(event.target.value);}}/></label><form onSubmit={event=>{event.preventDefault();void save();}} className="space-y-3"><fieldset disabled={isSubmitting} className="divide-y overflow-hidden rounded-xl border border-slate-200">{items.filter(item=>item.name.toLocaleLowerCase().includes(search.toLocaleLowerCase())).map(item=><label key={item.itemId} className="flex items-center gap-3 p-3"><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{item.name}</span><span className="block text-xs text-muted">{item.location} · {item.unit}</span></span><Input className="w-24! shrink-0" aria-label={`Conteo de ${item.name} en ${item.location}`} type="number" min="0" max="9999999999.99" step="0.01" inputMode="decimal" placeholder="—" value={values[item.itemId]??""} onChange={event=>{setValues(current=>({...current,[item.itemId]:event.target.value}));}}/></label>)}</fieldset><FormMessage message={error}/>{error!==null&&<Link href={href} className="block py-2 text-sm underline">Abrir documento actualizado</Link>}<div className="sticky bottom-0 flex items-center gap-3 border-t bg-white py-3"><Link className="py-3 text-sm underline" href={href}>Cancelar</Link><Button type="submit" disabled={isSubmitting} className="flex-1">{isSubmitting?"Guardando…":"Guardar inventario"}</Button></div></form><Link className="inline-block py-2 text-sm underline" href={`/drinks/new?category=${encodeURIComponent(document.category)}&document=${document.id}`}>Agregar bebida</Link></main>;
}
