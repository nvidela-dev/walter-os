import type { ReactElement } from "react";

import { NavigationLink as Link } from "@/components/ui/navigation-link";
import { drinkCategory } from "@/lib/drinks/categories";
import { drinkDocumentHref } from "@/lib/drinks/documents";
import { getDrinkDocuments } from "@/lib/queries/drink-documents";

import { CreateDrinkDocumentForm } from "./create-document-form";
export const dynamic="force-dynamic";
export default async function DrinksPage({searchParams}:{searchParams:Promise<{category?:string;date?:string;view?:string}>}):Promise<ReactElement>{
 const params=await searchParams;const category=drinkCategory(params.category);const {today,documents}=await getDrinkDocuments(category);
 return <main className="space-y-4 py-4"><h1 className="text-xl font-bold">Inventarios · {category}</h1><p className="text-sm text-muted">Un archivo por fecha. Abrilo para consultar; elegí Editar para cambiar sus cantidades.</p><CreateDrinkDocumentForm key={category} category={category} today={params.date?.match(/^\d{4}-\d{2}-\d{2}$/)?params.date:today}/><div className="divide-y overflow-hidden rounded-xl border border-slate-200">{documents.map(doc=><Link key={doc.id} href={drinkDocumentHref(doc.id,doc.category,doc.date)+(params.view==="suppliers"?"&view=suppliers":"")} className="flex items-center justify-between gap-3 p-3"><div><p className="font-semibold">{doc.category} · {doc.date}</p><p className="text-xs text-muted">{doc.items.filter(item=>item.quantity!==null).length} de {doc.items.length} revisados</p></div><span className="text-sm text-emerald-800">Abrir →</span></Link>)}</div>{documents.length===0&&<p className="text-sm text-muted">Todavía no hay archivos en esta categoría.</p>}</main>;
}
