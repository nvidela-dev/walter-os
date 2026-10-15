import { randomUUID } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";

import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
const actor=vi.hoisted((): {id:string;role:"admin"|"waitress"|"kitchen"|null}=>({id:"owner",role:"waitress"}));
vi.mock("server-only",()=>({}));vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));
vi.mock("@/lib/auth/access",async()=>{const {canAccess}=await import("@/lib/auth/policy");return {requireAccess:async(area:"main"|"drinks"|"inventory")=>{if(!canAccess(actor.role,area))throw new Error("Denied");return actor.id;},getCurrentGroup:()=>Promise.resolve(actor.role),getCurrentActorName:()=>Promise.resolve(`Nombre ${actor.id}`)};});
vi.mock("@/db",async()=>{const {drizzle}=await import("drizzle-orm/pglite");const client=new PGlite();return {db:drizzle(client),testClient:client};});
import { createDrinkDocument, saveDrinkDocument } from "@/lib/actions/drink-documents";
import { getDrinkDocument, getDrinkDocuments } from "@/lib/queries/drink-documents";

import { inventoryBootstrapSql } from "../../../scripts/inventory-bootstrap";
let client:PGlite;const beer=randomUUID(),soft=randomUUID();let migratedId:string;
beforeAll(async()=>{
 const value:unknown=Reflect.get(await import("@/db"),"testClient");if(!(value instanceof PGlite))throw new Error("Missing db");client=value;
 for(const file of readdirSync("drizzle").filter(file=>file.endsWith('.sql')&&file<'0027').sort())await client.exec(readFileSync(`drizzle/${file}`,"utf8"));
 const product=randomUUID(),other=randomUUID();await client.query("INSERT INTO productos(id,nombre,unidad) VALUES($1,'Cerveza','unidad'),($2,'Agua','unidad')",[product,other]);
 await client.query("INSERT INTO inventario_bebidas_productos(id,producto_id,ubicacion,categoria,unidad_conteo) VALUES($1,$2,'Bar','Cervezas','botella'),($3,$4,'Bar','Refrescos','botella')",[beer,product,soft,other]);
 for(const quantity of ["0","5"])await client.query("INSERT INTO observaciones_bebidas(item_id,nombre,ubicacion,cantidad,unidad,registrado_por) VALUES($1,'Cerveza','Bar',$2,'botella','owner')",[beer,quantity]);
 await client.exec(readFileSync('drizzle/0027_drink_documents.sql','utf8'));
 const rows=await getDrinkDocuments("Cervezas");const doc=rows.documents[0];if(!doc)throw new Error("Missing migrated document");migratedId=doc.id;
},30000);
beforeEach(()=>{actor.id="owner";actor.role="waitress";});afterAll(async()=>{await client.close();});
it("converts legacy latest counts by actual save date, with actor/time events and no old count states",async()=>{
 const result=await getDrinkDocument(migratedId);expect(result?.document.items).toEqual([{itemId:beer,name:"Cerveza",location:"Bar",unit:"botella",quantity:"5.00"}]);
 expect(result?.canEdit).toBe(true);expect(result?.document.createdBy).toBe("owner");expect(result?.events).toHaveLength(2);
 expect((await client.query("SELECT * FROM observaciones_bebidas")).rows).toEqual([]);
 await expect(client.query("INSERT INTO observaciones_bebidas(item_id,nombre,ubicacion,cantidad,unidad,registrado_por) VALUES($1,'Cerveza','Bar',9,'botella','owner')",[beer])).rejects.toThrow("Open a drinks document");
});
it("creates one file per category/date and opening an existing file never changes its owner or values",async()=>{
 const a=await createDrinkDocument("Refrescos","2026-10-15");if(!a.ok)throw new Error(a.error);actor.id="viewer";const b=await createDrinkDocument("Refrescos","2026-10-15");expect(b).toEqual(a);
 const doc=await getDrinkDocument(a.data.id);expect(doc?.canEdit).toBe(false);expect(doc?.document.createdBy).toBe("owner");expect(doc?.document.items[0]?.quantity).toBeNull();
 const next=await createDrinkDocument("Refrescos","2026-10-16");expect(next.ok&&next.data.id!==a.data.id).toBe(true);
});
it("overwrites current values on the same document, preserving zero vs unknown without a count history",async()=>{
 const created=await createDrinkDocument("Cervezas","2026-10-17");if(!created.ok)throw new Error(created.error);const id=created.data.id;
 expect((await saveDrinkDocument(id,0,[{itemId:beer,quantity:"0",unit:"botella"}])).ok).toBe(true);
 expect((await getDrinkDocument(id))?.document.items[0]?.quantity).toBe("0.00");
 expect((await saveDrinkDocument(id,1,[{itemId:beer,quantity:"8",unit:"botella"}])).ok).toBe(true);
 expect((await getDrinkDocument(id))?.document.items[0]?.quantity).toBe("8.00");
 expect((await saveDrinkDocument(id,2,[{itemId:beer,quantity:null,unit:"botella"}])).ok).toBe(true);
 const reopened=await getDrinkDocument(id);expect(reopened?.document.items[0]?.quantity).toBeNull();expect(reopened?.events).toHaveLength(3);
 expect((await client.query<{column_name:string}>("SELECT column_name FROM information_schema.columns WHERE table_name='ediciones_documentos_bebidas' ORDER BY column_name")).rows.map(row=>row.column_name)).toEqual(["documento_id","fecha","id","nombre_usuario","usuario"]);
 expect((await client.query("SELECT * FROM documentos_bebidas WHERE id=$1",[id])).rows).toHaveLength(1);expect((await client.query("SELECT * FROM observaciones_bebidas")).rows).toHaveLength(0);
});
it("allows only Admin or creator to save and rejects concurrent, mixed-category, missing-row and stale-unit payloads atomically",async()=>{
 const doc=await getDrinkDocument(migratedId);if(!doc)throw new Error("Missing doc");const payload=[{itemId:beer,quantity:"9",unit:"botella"}];
 actor.id="viewer";expect((await saveDrinkDocument(migratedId,0,payload)).ok).toBe(false);expect((await getDrinkDocument(migratedId))?.canEdit).toBe(false);
 actor.role="admin";expect((await saveDrinkDocument(migratedId,0,payload)).ok).toBe(true);
 const before=await getDrinkDocument(migratedId);
 for(const [revision,rows] of [[0,payload],[1,[...payload,{itemId:soft,quantity:"1",unit:"botella"}]],[1,[]],[1,[{...payload[0],unit:"pack"}]]] as const)expect((await saveDrinkDocument(migratedId,revision,rows)).ok).toBe(false);
 expect(await getDrinkDocument(migratedId)).toEqual(before);
 for(const role of ["kitchen",null] as const){actor.role=role;await expect(getDrinkDocuments("Cervezas")).rejects.toThrow("Denied");await expect(createDrinkDocument("Cervezas","2026-10-18")).rejects.toThrow("Denied");await expect(saveDrinkDocument(migratedId,1,payload)).rejects.toThrow("Denied");}
});
it("retains date/category/creator identity and edit-event integrity, and bootstrap safely repeats",async()=>{
 await expect(client.query("UPDATE documentos_bebidas SET fecha='2020-01-01' WHERE id=$1",[migratedId])).rejects.toThrow("identity");
 await expect(client.query("DELETE FROM ediciones_documentos_bebidas")).rejects.toThrow("immutable");
 const before=(await client.query("SELECT * FROM documentos_bebidas ORDER BY id")).rows;await client.exec(inventoryBootstrapSql());await client.exec(inventoryBootstrapSql());expect((await client.query("SELECT * FROM documentos_bebidas ORDER BY id")).rows).toEqual(before);
 await client.exec("ALTER TABLE documentos_bebidas DISABLE TRIGGER documentos_bebidas_identidad");await expect(client.exec(inventoryBootstrapSql())).rejects.toThrow("Drinks document guards");
});
it("refuses a partially installed document schema",async()=>{
 const isolated=new PGlite();try{
  for(const file of readdirSync("drizzle").filter(file=>file.endsWith('.sql')&&file<'0027').sort())await isolated.exec(readFileSync(`drizzle/${file}`,"utf8"));
  await isolated.exec("CREATE TABLE documentos_bebidas(id uuid)");await expect(isolated.exec(inventoryBootstrapSql())).rejects.toThrow("Partial drinks document schema");
 }finally{await isolated.close();}
});
