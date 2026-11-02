import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";

import { ActiveMenuCatalogue } from "@/app/menu/active-menu-catalogue";
import type { menuVersions } from "@/db/schema";
const makeMenu = (name:string,price:string): typeof menuVersions.$inferSelect => ({id:name,menuName:name,status:"submitted",baseVersionId:null,revision:0,createdAt:new Date(),submittedAt:new Date(),createdBy:"admin",submittedBy:"admin",document:{sections:[{id:"section",name:"Pizzas",sortOrder:0}],items:[{id:"item",name:"Pizza",description:null,sellPrice:price,sectionId:"section",priceOptions:[],sourceNote:null,sourceKey:null,reviewNote:null,sortOrder:0,recipeId:null}]}});
it("opens on active contents and switches menu families without mixing prices",async()=>{
 const user=userEvent.setup();render(<ActiveMenuCatalogue menus={[makeMenu("Don Juan","400.00"),makeMenu("Genüsse","350.00")]}/>);
 expect(screen.getByText("Menú activo")).toBeInTheDocument();expect(screen.getByText("$400.00")).toBeInTheDocument();expect(screen.queryByText("$350.00")).not.toBeInTheDocument();
 await user.click(screen.getByRole("button",{name:"Genüsse"}));expect(screen.getByText("$350.00")).toBeInTheDocument();expect(screen.queryByText("$400.00")).not.toBeInTheDocument();
 expect(screen.queryByRole("button",{name:/Guardar|Presentar/})).not.toBeInTheDocument();
});
