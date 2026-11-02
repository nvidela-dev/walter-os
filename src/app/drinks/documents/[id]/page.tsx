import { notFound, redirect } from "next/navigation";
import type { ReactElement } from "react";

import { drinkDocumentHref } from "@/lib/drinks/documents";
import { getDrinkDocument } from "@/lib/queries/drink-documents";
import { getDrinkSuppliers } from "@/lib/queries/drinks";

import { DrinkDocumentView } from "./document-view";
export const dynamic="force-dynamic";
export default async function DrinkDocumentPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{category?:string;date?:string;view?:string}>}):Promise<ReactElement>{
 const result=await getDrinkDocument((await params).id);if(!result)notFound();const query=await searchParams;
 if(query.category!==result.document.category || query.date!==result.document.date)redirect(drinkDocumentHref(result.document.id,result.document.category,result.document.date)+(query.view==="suppliers"?"&view=suppliers":""));
 return <DrinkDocumentView {...result} suppliers={await getDrinkSuppliers()} supplierView={query.view==="suppliers"}/>;
}
