import { notFound, redirect } from "next/navigation";
import type { ReactElement } from "react";

import { drinkDocumentHref } from "@/lib/drinks/documents";
import { getDrinkDocument } from "@/lib/queries/drink-documents";
import { getDrinkCountItems } from "@/lib/queries/drinks";

import { DrinkDocumentEditor } from "./document-editor";
export const dynamic="force-dynamic";
export default async function EditDrinkDocumentPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{category?:string;date?:string}>}):Promise<ReactElement>{
 const result=await getDrinkDocument((await params).id);if(!result)notFound();const {document,canEdit}=result;
 if(!canEdit)redirect(drinkDocumentHref(document.id,document.category,document.date));
 const query=await searchParams;
 if(query.category!==document.category || query.date!==document.date)redirect(drinkDocumentHref(document.id,document.category,document.date,true));
 const inventory=await getDrinkCountItems();const items=[...document.items,...inventory.filter(item=>item.category===document.category&&!document.items.some(saved=>saved.itemId===item.id)).map(item=>({itemId:item.id,name:item.name,location:item.location,unit:item.unit,quantity:null}))];
 return <DrinkDocumentEditor key={`${document.id}:${document.revision}`} document={document} items={items}/>;
}
