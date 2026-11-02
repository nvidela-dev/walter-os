import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

import { NewMenuForm } from "@/app/menu/new/new-menu-form";
import { MenuVersionEditor } from "@/app/menu/versions/[id]/version-editor";
import { createMenuDraft, saveMenuDraft, submitMenuDraft } from "@/lib/actions/menu-versions";
import type { MenuDocument } from "@/lib/menu/versions";
const push=vi.hoisted(()=>vi.fn());
vi.mock("next/navigation",()=>({useRouter:()=>({refresh:vi.fn(),push})}));
vi.mock("@/lib/actions/menu-versions",()=>({createMenuDraft:vi.fn(),saveMenuDraft:vi.fn(),submitMenuDraft:vi.fn(),rebaseMenuDraft:vi.fn()}));
const document:MenuDocument={sections:[{id:"00000000-0000-4000-8000-000000000001",name:"Pizzas",sortOrder:0}],items:[{id:"00000000-0000-4000-8000-000000000002",name:"Pizza",sellPrice:"400.00",description:null,sectionId:"00000000-0000-4000-8000-000000000001",priceOptions:[{label:"Grande",price:"500.00"}],sourceNote:"Foto",sourceKey:null,reviewNote:"Revisar",sortOrder:0,recipeId:null}]};
const version={id:"00000000-0000-4000-8000-000000000003",menuName:"Don Juan",status:"draft" as const,baseVersionId:"00000000-0000-4000-8000-000000000004",revision:0,document,createdAt:new Date(),submittedAt:null,createdBy:"admin",submittedBy:null};
it("creates a copy of the selected menu family",async()=>{
 const user=userEvent.setup();vi.mocked(createMenuDraft).mockResolvedValue({ok:true,data:{id:"draft"}});
 render(<NewMenuForm families={["Don Juan","Genüsse"]}/>);
 await user.selectOptions(screen.getByLabelText("Carta"),"Genüsse");await user.click(screen.getByRole("button",{name:"Crear borrador"}));
 expect(createMenuDraft).toHaveBeenCalledWith("Genüsse");expect(push).toHaveBeenCalledWith("/menu/versions/draft");
});
it("saves draft edits then shows price comparison before enabling submission",async()=>{
 const user=userEvent.setup();vi.mocked(saveMenuDraft).mockResolvedValue({ok:true,data:{revision:1}});vi.mocked(submitMenuDraft).mockResolvedValue({ok:true,data:undefined});
 render(<MenuVersionEditor version={version} baseline={document} stale={false} baselineDate="2026-10-14T12:00:00Z"/>);
 expect(screen.queryByRole("button",{name:"Presentar y activar menú"})).not.toBeInTheDocument();
 await user.click(screen.getByText("Pizza"));const price=screen.getByLabelText("Precio de venta");await user.clear(price);await user.type(price,"450");
 await user.click(screen.getByRole("button",{name:"Guardar y comparar"}));
 expect(await screen.findByRole("heading",{name:"Comparar antes de presentar"})).toBeInTheDocument();
 expect(screen.getByText("Precio: $400.00 → $450.00")).toBeInTheDocument();
 expect(screen.getByText("Sección: Pizzas")).toBeInTheDocument();
 await user.click(screen.getByRole("button",{name:"Presentar y activar menú"}));
 expect(submitMenuDraft).toHaveBeenCalledWith(version.id,1,version.baseVersionId);
});
it("displays submitted contents with no price editing or save controls",()=>{
 render(<MenuVersionEditor version={{...version,status:"submitted",submittedAt:new Date(),submittedBy:"admin"}} baseline={document} stale={false} baselineDate={null}/>);
 expect(screen.getByText("$400.00")).toBeInTheDocument();
 expect(screen.queryByLabelText("Precio de venta")).not.toBeInTheDocument();
 expect(screen.queryByRole("button",{name:"Guardar borrador"})).not.toBeInTheDocument();
});
