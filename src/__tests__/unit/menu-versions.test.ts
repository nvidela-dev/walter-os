import { randomUUID } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";

import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, expect, it, vi } from "vitest";
vi.mock("server-only",()=>({}));
vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));
vi.mock("@/lib/auth/access",()=>({requireAccess:vi.fn(()=>Promise.resolve("admin"))}));
vi.mock("@/db",async()=>{const {drizzle}=await import("drizzle-orm/pglite");const client=new PGlite();return {db:drizzle(client),testClient:client};});
import { createMenuItem, deleteMenuItem, saveMenuSection, updateMenuItem } from "@/lib/actions/menu";
import { createMenuDraft, discardMenuDraft, rebaseMenuDraft, saveMenuDraft, submitMenuDraft } from "@/lib/actions/menu-versions";
import { requireAccess } from "@/lib/auth/access";
import { compareMenus, type MenuDocument, menuDocumentSchema } from "@/lib/menu/versions";
import { getActiveMenuVersion, getLatestMenuVersion, getMenuVersion, getMenuVersions } from "@/lib/queries/menu-versions";

import { inventoryBootstrapSql } from "../../../scripts/inventory-bootstrap";
let client:PGlite;
const section=randomUUID(),otherSection=randomUUID(),item=randomUUID();
let original:MenuDocument;
let initialId:string;
beforeAll(async()=>{
 const value:unknown=Reflect.get(await import("@/db"),"testClient");if(!(value instanceof PGlite))throw new Error("Missing db");client=value;
 for(const file of readdirSync("drizzle").filter(name=>name.endsWith(".sql")&&name<"0025").sort())await client.exec(readFileSync(`drizzle/${file}`,"utf8"));
 await client.query("INSERT INTO menu_secciones(id,carta,nombre,orden) VALUES($1,'Don Juan','Pizzas',1),($2,'Genüsse','Pizzas',1)",[section,otherSection]);
 await client.query("INSERT INTO menu(id,nombre,precio_venta,seccion_id,opciones_precio,nota_revision,fuente) VALUES($1,'Pizza',NULL,$2,'[{\"label\":\"Grande\",\"price\":\"400.00\"}]','Revisar foto','Foto original')",[item,section]);
 await client.query("INSERT INTO menu(nombre,precio_venta,seccion_id) VALUES('Pizza',350,$1)",[otherSection]);
 const before=(await client.query("SELECT * FROM menu ORDER BY id")).rows;
 await client.exec(readFileSync("drizzle/0025_menu_versions.sql","utf8"));
 const historyBefore=(await client.query("SELECT * FROM menu_versiones ORDER BY id")).rows;
 await client.exec(readFileSync("drizzle/0026_active_menus.sql","utf8"));
 expect((await client.query("SELECT * FROM menu_versiones ORDER BY id")).rows).toEqual(historyBefore);
 expect((await client.query("SELECT * FROM menu ORDER BY id")).rows).toEqual(before);
 const baseline=await getLatestMenuVersion("Don Juan");if(!baseline)throw new Error("Missing baseline");original=baseline.document;initialId=baseline.id;
},30000);
afterAll(async()=>{await client.close();});
it("preserves baseline identities, pending prices, options and review notes without touching other domains",async()=>{
 expect(original.items[0]).toMatchObject({id:item,sellPrice:null,priceOptions:[{label:"Grande",price:"400.00"}],reviewNote:"Revisar foto",sourceNote:"Foto original"});
 expect(menuDocumentSchema.safeParse(original).success).toBe(true);
 expect((await getLatestMenuVersion("Genüsse"))?.document.items[0]?.sellPrice).toBe("350.00");
 for(const table of ["productos","recetas","proveedor_productos","observaciones_bebidas"])expect((await client.query(`SELECT * FROM ${table}`)).rows).toHaveLength(0);
});
it("compares same identities, new/removed items, section moves and size prices",()=>{
 const old=original.items[0];if(!old)throw new Error("Missing item");const moved=randomUUID();
 const next:MenuDocument={sections:[...original.sections,{id:moved,name:"Especiales",sortOrder:2}],items:[{...old,name:"Pizza renombrada",sellPrice:"450",sectionId:moved,priceOptions:[{label:"Grande",price:"475.00"},{label:"Chica",price:null}]},{...old,id:randomUUID(),name:"Nueva",sellPrice:"600"}]};
 const changes=compareMenus(original,next);
 expect(changes[0]).toMatchObject({kind:"changed",previousSection:"Pizzas",section:"Especiales"});
 expect(changes[0]?.details).toContain("Grande: $400.00 → $475.00");
 expect(changes[0]?.details).toContain("Precio: Pendiente → $450.00");
 expect(changes[1]).toMatchObject({kind:"new",section:"Pizzas"});
 expect(compareMenus(original,{...original,items:[]})[0]?.kind).toBe("removed");
});
it("copies latest, saves optimistically, freezes submitted contents and isolates families",async()=>{
 const result=await createMenuDraft("Don Juan");if(!result.ok)throw new Error(result.error);const draft=await getMenuVersion(result.data.id);if(!draft)throw new Error("Missing draft");
 expect(draft.document).toEqual(original);expect(draft.baseVersionId).toBe(initialId);
 const changed=structuredClone(original);if(changed.items[0])changed.items[0].priceOptions[0]={label:"Grande",price:"475"};
 expect(await saveMenuDraft(draft.id,0,changed)).toEqual({ok:true,data:{revision:1}});
 expect((await saveMenuDraft(draft.id,0,original)).ok).toBe(false);
 expect((await submitMenuDraft(draft.id,0,initialId)).ok).toBe(false);
 expect((await submitMenuDraft(draft.id,1,initialId)).ok).toBe(true);
 expect((await getMenuVersion(initialId))?.document).toEqual(original);
 expect((await getMenuVersion(draft.id))?.document.items[0]?.priceOptions[0]?.price).toBe("475.00");
 expect((await getLatestMenuVersion("Genüsse"))?.document.items[0]?.sellPrice).toBe("350.00");
 expect((await saveMenuDraft(draft.id,2,original)).ok).toBe(false);
 await expect(client.query("UPDATE menu_versiones SET contenido='{}' WHERE id=$1",[draft.id])).rejects.toThrow("immutable");
 await expect(client.query("DELETE FROM menu_versiones WHERE id=$1",[draft.id])).rejects.toThrow("immutable");
 await expect(client.query("UPDATE menu SET precio_venta=999 WHERE id=$1",[item])).rejects.toThrow("Menu history is active");
 await expect(client.query("UPDATE menu_secciones SET nombre='Changed' WHERE id=$1",[section])).rejects.toThrow("Menu history is active");
 for(const action of [()=>createMenuItem({name:"Overwrite",sellPrice:"1"}),()=>updateMenuItem(item,{name:"Overwrite",sellPrice:"1"}),()=>deleteMenuItem(item),()=>saveMenuSection(section,{menuName:"Don Juan",name:"Overwrite",sortOrder:0})])expect((await action()).ok).toBe(false);
});
it("requires a new comparison after another draft submits and after a concurrent draft edit",async()=>{
 const a=await createMenuDraft("Don Juan"),b=await createMenuDraft("Don Juan");if(!a.ok||!b.ok)throw new Error("Missing drafts");
 const draft=await getMenuVersion(a.data.id);if(!draft)throw new Error("Missing draft");
 expect((await submitMenuDraft(a.data.id,0,draft.baseVersionId)).ok).toBe(true);
 expect((await submitMenuDraft(b.data.id,0,draft.baseVersionId)).ok).toBe(false);
 expect((await rebaseMenuDraft(b.data.id,0)).ok).toBe(true);
 const rebased=await getMenuVersion(b.data.id);if(!rebased)throw new Error("Missing rebase");
 expect(rebased.baseVersionId).toBe(a.data.id);expect(rebased.document).toEqual(draft.document);
 expect((await submitMenuDraft(b.data.id,1,rebased.baseVersionId)).ok).toBe(true);
});
it("enforces category assignments, unique identities/options, pending prices and Admin access",async()=>{
 const invalid=structuredClone(original);if(invalid.items[0])invalid.items[0].sectionId=randomUUID();expect(menuDocumentSchema.safeParse(invalid).success).toBe(false);
 const duplicate={...original,items:[...original.items,...original.items]};expect(menuDocumentSchema.safeParse(duplicate).success).toBe(false);
 for(const action of [()=>createMenuDraft("Don Juan"),()=>getMenuVersions(),()=>getMenuVersion(initialId),()=>getLatestMenuVersion("Don Juan"),()=>saveMenuDraft(initialId,0,original),()=>submitMenuDraft(initialId,0,null),()=>rebaseMenuDraft(initialId,0)]){vi.mocked(requireAccess).mockRejectedValueOnce(new Error("Denied"));await expect(action()).rejects.toThrow("Denied");}
});
it("keeps exactly one active submitted menu per family and drafting leaves it unchanged",async()=>{
 const first=await getActiveMenuVersion("Don Juan"),other=await getActiveMenuVersion("Genüsse");if(!first||!other)throw new Error("Missing active menus");
 const draft=await createMenuDraft("Don Juan");if(!draft.ok)throw new Error("Missing draft");
 expect((await getActiveMenuVersion("Don Juan"))?.id).toBe(first.id);
 expect((await getMenuVersion(draft.data.id))?.document).toEqual(first.document);
 expect((await submitMenuDraft(draft.data.id,0,first.id)).ok).toBe(true);
 expect((await getActiveMenuVersion("Don Juan"))?.id).toBe(draft.data.id);
 expect((await getActiveMenuVersion("Genüsse"))?.id).toBe(other.id);
 expect((await getMenuVersion(first.id))?.document).toEqual(first.document);
 expect((await client.query("SELECT carta,count(*)::int AS n FROM menus_activos GROUP BY carta ORDER BY carta")).rows).toEqual([{carta:"Don Juan",n:1},{carta:"Genüsse",n:1}]);
 await expect(client.query("UPDATE menus_activos SET version_id=$1 WHERE carta='Don Juan'",[other.id])).rejects.toThrow("latest submitted");
 await expect(client.query("UPDATE menus_activos SET version_id=$1 WHERE carta='Don Juan'",[first.id])).rejects.toThrow("latest submitted");
 await expect(client.query("DELETE FROM menus_activos WHERE carta='Don Juan'")).rejects.toThrow("cannot be removed");
 vi.mocked(requireAccess).mockRejectedValueOnce(new Error("Denied"));await expect(getActiveMenuVersion("Don Juan")).rejects.toThrow("Denied");
});
it("bootstrap preserves versions and fails closed if immutability is disabled",async()=>{
 const before=(await client.query("SELECT * FROM menu_versiones ORDER BY id")).rows;
 await client.exec(inventoryBootstrapSql());await client.exec(inventoryBootstrapSql());
 expect((await client.query("SELECT * FROM menu_versiones ORDER BY id")).rows).toEqual(before);
 await client.exec("ALTER TABLE menu_versiones DISABLE TRIGGER menu_versiones_inmutables");
 await expect(client.exec(inventoryBootstrapSql())).rejects.toThrow("Menu version immutability");
});

it("discards only the current draft revision while preserving active and historical menus", async () => {
 const activeBefore = await getActiveMenuVersion("Don Juan");
 const historyBefore = (await getMenuVersions()).filter(version => version.status === "submitted");
 const result = await createMenuDraft("Don Juan");
 if (!result.ok) throw new Error(result.error);
 const draft = await getMenuVersion(result.data.id);
 if (!draft) throw new Error("Missing draft");
 expect((await saveMenuDraft(draft.id, 0, draft.document)).ok).toBe(true);
 expect((await discardMenuDraft(draft.id, 0)).ok).toBe(false);
 expect(await getMenuVersion(draft.id)).not.toBeNull();
 expect((await discardMenuDraft(draft.id, 1)).ok).toBe(true);
 expect(await getMenuVersion(draft.id)).toBeNull();
 if (activeBefore) expect((await discardMenuDraft(activeBefore.id, activeBefore.revision)).ok).toBe(false);
 expect(await getActiveMenuVersion("Don Juan")).toEqual(activeBefore);
 expect((await getMenuVersions()).filter(version => version.status === "submitted")).toEqual(historyBefore);
});
