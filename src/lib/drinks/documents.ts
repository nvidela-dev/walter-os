import { z } from "zod";

import { nonNegativeDecimalSchema, requiredTextSchema, uuidSchema } from "@/lib/validation";

import { DRINK_CATEGORIES } from "./categories";
export const documentCategorySchema = z.enum(DRINK_CATEGORIES);
export const documentCountsSchema = z.array(z.object({itemId:uuidSchema,quantity:nonNegativeDecimalSchema(2).refine(value=>Number(value)<10000000000).nullable(),unit:requiredTextSchema})).max(1000).refine(rows=>new Set(rows.map(row=>row.itemId)).size===rows.length,"Hay bebidas repetidas.");
export function drinkDocumentHref(id:string,category:string,date:string,edit=false):string {
 return `/drinks/documents/${id}${edit?"/edit":""}?category=${encodeURIComponent(category)}&date=${date}`;
}
