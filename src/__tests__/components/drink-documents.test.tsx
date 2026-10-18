vi.mock("@/lib/actions/delete-inventory", () => ({ deleteSavedInventory: vi.fn() }));
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";

import { CreateDrinkDocumentForm } from "@/app/drinks/create-document-form";
import { DrinkDocumentView } from "@/app/drinks/documents/[id]/document-view";
import { DrinkDocumentEditor } from "@/app/drinks/documents/[id]/edit/document-editor";
import type { drinkDocuments } from "@/db/schema";
import { deleteSavedInventory } from "@/lib/actions/delete-inventory";
import { createDrinkDocument, saveDrinkDocument } from "@/lib/actions/drink-documents";
const push=vi.hoisted(()=>vi.fn());vi.mock("next/navigation",()=>({useRouter:()=>({push,refresh:vi.fn()})}));
vi.mock("@/lib/actions/drink-documents",()=>({saveDrinkDocument:vi.fn(),createDrinkDocument:vi.fn()}));
const doc:typeof drinkDocuments.$inferSelect={id:"00000000-0000-4000-8000-000000000001",date:"2026-10-15",category:"Cervezas",revision:3,createdBy:"owner",createdAt:new Date(),updatedAt:new Date(),items:[{itemId:"00000000-0000-4000-8000-000000000002",name:"Corona",unit:"botella",location:"Bar",quantity:"7.00"},{itemId:"00000000-0000-4000-8000-000000000003",name:"Patagonia",unit:"botella",location:"Bar",quantity:null}]};
beforeEach(()=>{vi.clearAllMocks();});
it("opens as compact read-only saved values and offers Edit only to authorized people",()=>{
 const {rerender}=render(<DrinkDocumentView document={doc} canEdit={true} userId="owner" events={[]} suppliers={[]}/>);
 expect(screen.getByText("7.00 botella")).toBeInTheDocument();expect(screen.getByText("Sin revisar")).toBeInTheDocument();expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();expect(screen.getByRole("link",{name:"Editar"})).toHaveAttribute("href",expect.stringContaining(`${doc.id}/edit?category=Cervezas`));
 rerender(<DrinkDocumentView document={doc} canEdit={false} userId="viewer" events={[]} suppliers={[]}/>);expect(screen.queryByRole("link",{name:"Editar"})).not.toBeInTheDocument();
});
it("prefills saved quantities, keeps inputs on failure, and saves back to the same document display",async()=>{
 const user=userEvent.setup();vi.mocked(saveDrinkDocument).mockResolvedValue({ok:false,error:"Otra persona guardó cambios"});
 render(<DrinkDocumentEditor document={doc} items={doc.items}/>);const count=screen.getByRole("spinbutton",{name:"Conteo de Corona en Bar"});expect(count).toHaveValue(7);await user.clear(count);await user.type(count,"0");await user.click(screen.getByRole("button",{name:"Guardar inventario"}));
 expect(await screen.findByText("Otra persona guardó cambios")).toBeInTheDocument();expect(count).toHaveValue(0);expect(saveDrinkDocument).toHaveBeenCalledWith(doc.id,3,[{itemId:doc.items[0]?.itemId,unit:"botella",quantity:"0"},{itemId:doc.items[1]?.itemId,unit:"botella",quantity:null}]);
 vi.mocked(saveDrinkDocument).mockResolvedValue({ok:true,data:undefined});await user.click(screen.getByRole("button",{name:"Guardar inventario"}));expect(push).toHaveBeenCalledWith(`/drinks/documents/${doc.id}?category=Cervezas&date=2026-10-15`);
});
it("shows a supplier breakdown without duplicating stock across multiple providers",()=>{
 render(<DrinkDocumentView document={{...doc,items:doc.items.map(item=>({...item,quantity:"0.00"}))}} canEdit={false} userId="viewer" events={[]} supplierView suppliers={[{itemId:doc.items[0]?.itemId??"",providerId:"a",name:"Primero"},{itemId:doc.items[0]?.itemId??"",providerId:"b",name:"Segundo"}]}/>);
 expect(screen.getAllByText("Corona")).toHaveLength(1);expect(screen.getByRole("heading",{name:"Varios proveedores: Primero, Segundo"})).toBeInTheDocument();expect(screen.getByRole("heading",{name:"Sin proveedor"})).toBeInTheDocument();expect(screen.getAllByText("0.00 botella")).toHaveLength(2);
});
it("creates or opens one dated file in display mode",async()=>{
 const user=userEvent.setup();vi.mocked(createDrinkDocument).mockResolvedValue({ok:true,data:{id:doc.id}});render(<CreateDrinkDocumentForm category="Cervezas" today="2026-10-15"/>);await user.click(screen.getByRole("button",{name:"Crear o abrir Cervezas"}));expect(createDrinkDocument).toHaveBeenCalledWith("Cervezas","2026-10-15");expect(push).toHaveBeenCalledWith(`/drinks/documents/${doc.id}?category=Cervezas&date=2026-10-15`);
});

it("requires explicit confirmation before deleting a saved inventory", async () => {
 const user = userEvent.setup();
 vi.mocked(deleteSavedInventory).mockResolvedValue({ok:true,data:undefined});
 render(<DrinkDocumentView document={doc} canEdit userId="owner" events={[]} suppliers={[]} />);
 await user.click(screen.getByRole("button",{name:"Eliminar inventario"}));
 expect(deleteSavedInventory).not.toHaveBeenCalled();
 await user.click(screen.getByRole("button",{name:"Conservar inventario"}));
 expect(deleteSavedInventory).not.toHaveBeenCalled();
 await user.click(screen.getByRole("button",{name:"Eliminar inventario"}));
 await user.click(screen.getByRole("button",{name:"Sí, eliminar inventario"}));
 expect(deleteSavedInventory).toHaveBeenCalledWith("drinks",doc.id,"3");
 expect(push).toHaveBeenCalledWith("/drinks");
});
