"use server";
import { and, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

import { db } from "@/db";
import { drinkDocuments, drinkItems, products } from "@/db/schema";
import { actionError, actionOk, type ActionResult, unknownActionError } from "@/lib/action-result";
import { getCurrentActorName, getCurrentGroup, requireAccess } from "@/lib/auth/access";
import { documentCategorySchema, documentCountsSchema } from "@/lib/drinks/documents";
import { isoDateSchema, uuidSchema } from "@/lib/validation";
export async function createDrinkDocument(category:string,date:string):Promise<ActionResult<{id:string}>> {
 const actor=await requireAccess("drinks");
 try{
  documentCategorySchema.parse(category);isoDateSchema.parse(date);
  const items=await db.select({itemId:drinkItems.id,name:products.name,location:drinkItems.location,unit:sql<string>`coalesce(${drinkItems.countUnit},${products.unit})`}).from(drinkItems).innerJoin(products,and(eq(products.id,drinkItems.productId),isNull(products.deletedAt))).where(and(eq(drinkItems.category,category),eq(drinkItems.active,true))).orderBy(drinkItems.location,products.name);
  const [doc]=await db.insert(drinkDocuments).values({category,date,createdBy:actor,items:items.map(item=>({...item,quantity:null}))}).onConflictDoNothing({target:[drinkDocuments.date,drinkDocuments.category]}).returning({id:drinkDocuments.id});
  if(doc){revalidatePath("/drinks","layout");return actionOk(doc);}
  const [existing]=await db.select({id:drinkDocuments.id}).from(drinkDocuments).where(and(eq(drinkDocuments.date,date),eq(drinkDocuments.category,category)));
  return existing? actionOk(existing):actionError("No se pudo abrir el documento.");
 }catch(error){return unknownActionError(error);}
}
export async function saveDrinkDocument(id:string,revision:number,input:unknown):Promise<ActionResult> {
 const actor=await requireAccess("drinks");
 try{
  uuidSchema.parse(id);if(!Number.isSafeInteger(revision)||revision<0)return actionError("Revisión inválida.");
  const counts=documentCountsSchema.parse(input);const admin=await getCurrentGroup()==="admin";
  await db.execute(sql`SELECT public.save_drink_document(${id}::uuid,${revision},${JSON.stringify(counts)}::jsonb,${actor},${await getCurrentActorName()},${admin})`);
  revalidatePath("/drinks","layout");return actionOk(undefined);
 }catch(error){const message=error instanceof Error?error.message+String(error.cause):String(error);
  if(message.includes("drink_denied"))return actionError("Solo Admin o quien creó este inventario puede editarlo.");
  if(message.includes("drink_conflict"))return actionError("Otra persona guardó cambios. Tus entradas siguen aquí; abrí el documento actualizado antes de volver a editar.");
  if(message.includes("drink_unit")||message.includes("drink_invalid"))return actionError("La lista o la unidad cambió. Abrí el documento actualizado antes de guardar.");
  if(error instanceof ZodError)return unknownActionError(error);
  return actionError("No se pudo guardar el inventario. Tus entradas se conservan.");
 }
}
