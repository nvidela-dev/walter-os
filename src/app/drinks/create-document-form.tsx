"use client";
import { useRouter } from "next/navigation";
import { type ReactElement, useState } from "react";

import { FormMessage } from "@/components/form-feedback";
import { useActionForm } from "@/components/hooks/use-action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createDrinkDocument } from "@/lib/actions/drink-documents";
import { drinkDocumentHref } from "@/lib/drinks/documents";
export function CreateDrinkDocumentForm({category,today}: {category:string;today:string}):ReactElement {
 const router=useRouter();const [date,setDate]=useState(today);const {error,isSubmitting,runAction}=useActionForm();
 return <form className="space-y-3 rounded-xl border border-slate-200 p-3" onSubmit={event=>{event.preventDefault();void runAction(()=>createDrinkDocument(category,date)).then(result=>{if(result.ok)router.push(drinkDocumentHref(result.data.id,category,date));});}}><label className="block text-sm">Fecha<Input type="date" required value={date} disabled={isSubmitting} onChange={event=>{setDate(event.target.value);}}/></label><Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting?"Abriendo…":`Crear o abrir ${category}`}</Button><FormMessage message={error}/></form>;
}
