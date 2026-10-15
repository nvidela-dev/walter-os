import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { drinkDocuments, drinkEditEvents } from "@/db/schema";
import { getCurrentGroup, requireAccess } from "@/lib/auth/access";
import { documentCategorySchema } from "@/lib/drinks/documents";
import { parseUuidOrNull } from "@/lib/validation";
export async function getDrinkDocuments(category:string):Promise<{today:string;documents:(typeof drinkDocuments.$inferSelect)[]}> {
 await requireAccess("drinks");documentCategorySchema.parse(category);
 const clock=await db.execute<{date:string}>(sql`SELECT (now() AT TIME ZONE 'America/Montevideo')::date::text AS date`);
 const today=clock.rows[0]?.date;if(today===undefined)throw new Error("Missing date");
 const documents=await db.select().from(drinkDocuments).where(eq(drinkDocuments.category,category)).orderBy(desc(drinkDocuments.date));
 return {today,documents};
}
export async function getDrinkDocument(id:string):Promise<{document:typeof drinkDocuments.$inferSelect;canEdit:boolean;userId:string;events:(typeof drinkEditEvents.$inferSelect)[]}|null> {
 const userId=await requireAccess("drinks");if(parseUuidOrNull(id)===null)return null;
 const [document]=await db.select().from(drinkDocuments).where(eq(drinkDocuments.id,id));if(!document)return null;
 const canEdit=document.createdBy===userId||await getCurrentGroup()==="admin";
 const events=await db.select().from(drinkEditEvents).where(eq(drinkEditEvents.documentId,id)).orderBy(desc(drinkEditEvents.recordedAt));
 return {document,canEdit,userId,events};
}
export async function findDrinkDocument(category:string,date:string):Promise<typeof drinkDocuments.$inferSelect|null> {
 await requireAccess("drinks");const [doc]=await db.select().from(drinkDocuments).where(and(eq(drinkDocuments.category,category),eq(drinkDocuments.date,date)));return doc??null;
}
