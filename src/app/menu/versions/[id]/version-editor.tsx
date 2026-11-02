"use client";
import { useRouter } from "next/navigation";
import { type ReactElement, useState } from "react";

import { FormMessage } from "@/components/form-feedback";
import { useActionForm } from "@/components/hooks/use-action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { menuVersions } from "@/db/schema";
import { rebaseMenuDraft, saveMenuDraft, submitMenuDraft } from "@/lib/actions/menu-versions";
import { compareMenus, type MenuDocument, menuDocumentSchema } from "@/lib/menu/versions";

import { DiscardDraft } from "../../discard-draft";

type Item = MenuDocument["items"][number];
export function MenuVersionEditor({version,baseline,stale,baselineDate}: {version: typeof menuVersions.$inferSelect; baseline: MenuDocument; stale: boolean; baselineDate: string | null}): ReactElement {
  const router = useRouter();
  const [document,setDocument] = useState(version.document);
  const [revision,setRevision] = useState(version.revision);
  const [review,setReview] = useState(false);
  const [search,setSearch] = useState("");
  const [sectionFilter,setSectionFilter] = useState("");
  const [saved,setSaved] = useState(false);
  const {error,isSubmitting,runAction} = useActionForm();
  const editable = version.status === "draft";
  const changes = compareMenus(baseline,document);
  function updateItem(id: string, patch: Partial<Item>): void {
    setDocument(current => ({...current,items:current.items.map(item => item.id === id ? {...item,...patch} : item)})); setSaved(false);
  }
  async function save(compare: boolean): Promise<void> {
    const result = await runAction(() => saveMenuDraft(version.id,revision,document));
    if(result.ok) {setDocument(menuDocumentSchema.parse(document)); setRevision(result.data.revision); setSaved(true); setReview(compare);}
  }
  async function submit(): Promise<void> {
    const result = await runAction(() => submitMenuDraft(version.id,revision,version.baseVersionId));
    if(result.ok) {router.push("/menu");router.refresh();} else router.refresh();
  }
  const visible = document.items.filter(item => item.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()) && (!sectionFilter || item.sectionId === sectionFilter));
  return <main className="space-y-4 py-5">
    <p className="text-sm text-muted">{editable ? "Editá esta copia. La carta vigente y sus precios quedan guardados hasta que presentes la nueva versión." : `Versión guardada el ${version.submittedAt?.toLocaleString("es-UY",{timeZone:"America/Montevideo"}) ?? "—"}. Esta carta conserva sus precios y contenido.`}</p>
    {stale && <div role="alert" className="space-y-2 rounded-xl bg-amber-50 p-3"><p>Hay una carta más reciente. Guardá tus cambios y actualizá la comparación antes de presentar. Tu borrador se conserva completo; revisá también los ítems quitados.</p><Button disabled={isSubmitting || !saved} onClick={() => {void runAction(() => rebaseMenuDraft(version.id,revision)).then(result => {if(result.ok) router.refresh();});}}>Comparar con la última carta</Button></div>}
    {editable && <DiscardDraft id={version.id} revision={revision} disabled={isSubmitting} />}
    <FormMessage message={error} />
    {saved && !review && <p role="status" className="text-sm text-emerald-800">Borrador guardado.</p>}
    {review ? <>
      <h1 className="text-xl font-bold">Comparar antes de presentar</h1>
      <p className="text-sm">Comparación con {baselineDate === null ? "ninguna carta anterior" : `la carta del ${new Date(baselineDate).toLocaleString("es-UY",{timeZone:"America/Montevideo"})}`}, de {version.menuName}.</p>
      <p className="rounded-xl bg-slate-50 p-3 text-sm">{changes.filter(row => row.kind === "new").length} nuevos · {changes.filter(row => row.kind === "changed").length} modificados · {changes.filter(row => row.kind === "removed").length} quitados · {changes.filter(row => row.kind === "unchanged").length} sin cambios</p>
      {JSON.stringify(baseline.sections) !== JSON.stringify(document.sections) && <section className="rounded-xl border p-3"><h2 className="font-semibold">Secciones y orden</h2><p className="text-sm">Antes: {[...baseline.sections].sort((a,b) => a.sortOrder-b.sortOrder).map(section => section.name).join(" · ") || "Sin secciones"}</p><p className="text-sm">Ahora: {[...document.sections].sort((a,b) => a.sortOrder-b.sortOrder).map(section => section.name).join(" · ") || "Sin secciones"}</p></section>}
      {changes.filter(change => change.kind !== "unchanged").map(change => <section key={change.id} className="space-y-1 rounded-xl border p-3"><p className="text-xs font-semibold uppercase text-emerald-800">{change.kind === "new" ? "Nuevo ítem" : change.kind === "removed" ? "Quitado" : "Modificado"}</p><h2 className="font-bold">{change.name}</h2><p className="text-sm">Sección: {change.section}</p>{change.details.map((detail,index) => <p key={index} className="text-sm">{detail}</p>)}</section>)}
      <p className="text-sm text-muted">Presentar activa este menú y conserva la versión anterior con todos sus precios. Los precios pendientes siguen pendientes.</p>
      <div className="flex flex-wrap gap-2"><Button variant="secondary" busy={isSubmitting} onClick={() => {setReview(false);}}>Volver a editar</Button><Button disabled={isSubmitting || stale || document.items.length === 0} onClick={() => {void submit();}}>Presentar y activar menú</Button></div>
    </> : <>
      {editable && <details className="rounded-xl border p-3"><summary className="cursor-pointer font-semibold">Secciones de {version.menuName}</summary><fieldset disabled={isSubmitting} className="space-y-3 pt-3">{document.sections.map(section => <div key={section.id} className="flex gap-2"><Input className="min-w-0 flex-1" aria-label={`Nombre de sección ${section.name}`} value={section.name} onChange={event => {setDocument(current => ({...current,sections:current.sections.map(row => row.id === section.id ? {...row,name:event.target.value} : row)}));setSaved(false);}} /><Input className="w-20!" aria-label={`Orden de sección ${section.name}`} type="number" min="0" max="10000" value={section.sortOrder} onChange={event => {setDocument(current => ({...current,sections:current.sections.map(row => row.id === section.id ? {...row,sortOrder:Number(event.target.value)} : row)}));setSaved(false);}} /><Button variant="ghost" disabled={document.items.some(item => item.sectionId === section.id)} onClick={() => {setDocument(current => ({...current,sections:current.sections.filter(row => row.id !== section.id)}));setSaved(false);}}>Quitar</Button></div>)}<Button variant="secondary" onClick={() => {setDocument(current => ({...current,sections:[...current.sections,{id:crypto.randomUUID(),name:"Nueva sección",sortOrder:current.sections.length}]}));setSaved(false);}}>Agregar sección</Button></fieldset></details>}
      <div className="grid gap-2 sm:grid-cols-2"><label className="block text-sm">Buscar ítem<Input type="search" value={search} onChange={event => {setSearch(event.target.value);}} /></label><label className="block text-sm">Sección<Select value={sectionFilter} onChange={event => {setSectionFilter(event.target.value);}}><option value="">Todas las secciones</option>{[...document.sections].sort((a,b) => a.sortOrder-b.sortOrder).map(section => <option key={section.id} value={section.id}>{section.name}</option>)}</Select></label></div>
      <p className="text-sm text-muted">{document.items.length} ítems · {visible.length} en esta vista</p>
      {visible.sort((a,b) => (document.sections.find(section => section.id === a.sectionId)?.sortOrder ?? 0)-(document.sections.find(section => section.id === b.sectionId)?.sortOrder ?? 0) || a.sortOrder-b.sortOrder || a.name.localeCompare(b.name)).map(item => <details key={item.id} className="rounded-xl border"><summary className="cursor-pointer p-3"><div className="flex justify-between gap-3"><span className="font-semibold">{item.name || "Nuevo ítem"}</span><span className="shrink-0 text-sm">{item.sellPrice === null ? item.priceOptions.length > 0 ? "Ver opciones" : "Precio pendiente" : `$${item.sellPrice}`}</span></div><p className="text-xs text-muted">{document.sections.find(section => section.id === item.sectionId)?.name ?? "Sin sección"}</p>{item.description !== null && <p className="whitespace-pre-line text-sm text-muted">{item.description}</p>}{item.priceOptions.length > 0 && <p className="text-sm">{item.priceOptions.map(option => `${option.label}: ${option.price === null ? "Pendiente" : `$${option.price}`}`).join(" · ")}</p>}{item.reviewNote !== null && <p className="text-xs text-amber-800">Revisar: {item.reviewNote}</p>}</summary>{editable && <fieldset disabled={isSubmitting} className="space-y-3 border-t p-3">
        <label className="block text-sm">Nombre<Input value={item.name} maxLength={200} onChange={event => {updateItem(item.id,{name:event.target.value});}} /></label>
        <div className="grid gap-2 sm:grid-cols-2"><label className="block text-sm">Precio de venta<Input type="number" min="0.01" step="0.01" value={item.sellPrice ?? ""} placeholder="Pendiente" onChange={event => {updateItem(item.id,{sellPrice:event.target.value || null});}} /></label><label className="block text-sm">Sección del ítem<Select value={item.sectionId ?? ""} onChange={event => {updateItem(item.id,{sectionId:event.target.value});}}>{document.sections.map(section => <option key={section.id} value={section.id}>{section.name}</option>)}</Select></label></div>
        <label className="block text-sm">Descripción<Textarea value={item.description ?? ""} onChange={event => {updateItem(item.id,{description:event.target.value || null});}} /></label>
        <label className="block text-sm">Orden del ítem<Input type="number" min="0" max="10000" value={item.sortOrder} onChange={event => {updateItem(item.id,{sortOrder:Number(event.target.value)});}} /></label>
        <fieldset className="space-y-2"><legend className="text-sm font-semibold">Tamaños y opciones</legend>{item.priceOptions.map((option,index) => <div key={index} className="flex gap-2"><Input className="min-w-0 flex-1" aria-label={`Opción ${index+1} de ${item.name}`} value={option.label} onChange={event => {updateItem(item.id,{priceOptions:item.priceOptions.map((row,n) => n === index ? {...row,label:event.target.value} : row)});}} /><Input className="min-w-0 flex-1" aria-label={`Precio de opción ${index+1} de ${item.name}`} type="number" min="0.01" step="0.01" value={option.price ?? ""} placeholder="Pendiente" onChange={event => {updateItem(item.id,{priceOptions:item.priceOptions.map((row,n) => n === index ? {...row,price:event.target.value || null} : row)});}} /><Button variant="ghost" aria-label={`Quitar opción ${index+1} de ${item.name}`} onClick={() => {updateItem(item.id,{priceOptions:item.priceOptions.filter((_,n) => n !== index)});}}>×</Button></div>)}<Button variant="secondary" onClick={() => {updateItem(item.id,{priceOptions:[...item.priceOptions,{label:"Nueva opción",price:null}]});}}>Agregar opción</Button></fieldset>
        <label className="block text-sm">Nota para revisar<Textarea value={item.reviewNote ?? ""} onChange={event => {updateItem(item.id,{reviewNote:event.target.value || null});}} /></label>
        {item.sourceNote !== null && <p className="text-xs text-muted">Fuente: {item.sourceNote}</p>}
        <Button variant="ghost" onClick={() => {setDocument(current => ({...current,items:current.items.filter(row => row.id !== item.id)}));setSaved(false);}}>Quitar de este borrador</Button>
      </fieldset>}</details>)}
      {editable && <><Button variant="secondary" disabled={isSubmitting || document.sections.length === 0} onClick={() => {setDocument(current => ({...current,items:[...current.items,{id:crypto.randomUUID(),name:"Nuevo ítem",description:null,sellPrice:null,sectionId:current.sections[0]?.id ?? null,priceOptions:[],reviewNote:null,sortOrder:current.items.length,recipeId:null,sourceNote:null,sourceKey:null}]}));setSearch("");setSectionFilter("");setSaved(false);}}>Agregar ítem</Button><div className="sticky bottom-0 flex flex-wrap gap-2 border-t bg-white py-3"><Button variant="secondary" busy={isSubmitting} onClick={() => {void save(false);}}>Guardar borrador</Button><Button busy={isSubmitting} onClick={() => {void save(true);}}>Guardar y comparar</Button></div></>}
    </>}
  </main>;
}
