import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";

import { MenuComparison } from "@/app/menu/compare/comparison";
import type { MenuDocument } from "@/lib/menu/versions";

const item = { id: "pizza", name: "Pizza", description: "Descripción anterior", sellPrice: "400", sectionId: "section", priceOptions: [{label:"Grande",price:"450"}], reviewNote: null, sortOrder: 0, recipeId: null, sourceNote: null, sourceKey: null };
const previous: MenuDocument = { sections: [{id:"section",name:"Pizzas",sortOrder:0}],items:[item, {...item,id:"same",name:"Sin cambios"}, {...item,id:"removed",name:"Quitado"}] };
const current: MenuDocument = {...previous,items:[{...item,sellPrice:"500",description:"Descripción actual",priceOptions:[{label:"Grande",price:"550"}]},previous.items[1] ?? item,{...item,id:"new",name:"Nuevo",sellPrice:null}]};
it("shows historical and active values, additions/removals, and preserves unknown prices", () => {
 render(<MenuComparison previous={previous} current={current} />);
 expect(screen.getAllByText("Descripción anterior").length).toBeGreaterThan(0);
 expect(screen.getAllByText("Descripción actual")).toHaveLength(1);
 expect(screen.getByText("Precio: $400.00 → $500.00")).toBeInTheDocument();
 expect(screen.getByText("Grande: $450.00 → $550.00")).toBeInTheDocument();
 expect(screen.getByRole("heading",{name:"Nuevo · Agregado al menú actual"})).toBeInTheDocument();
 expect(screen.getByRole("heading",{name:"Quitado · Quitado del menú actual"})).toBeInTheDocument();
 expect(screen.getAllByText("Precio: Pendiente").length).toBeGreaterThan(0);
 expect(screen.queryByRole("heading",{name:"Sin cambios · Sin cambios"})).not.toBeInTheDocument();
});
it("can include unchanged items and search previous names after a rename", async () => {
 const user=userEvent.setup();
 render(<MenuComparison previous={previous} current={{...current,items:current.items.map(row=>row.id==="pizza"?{...row,name:"Margarita"}:row)}} />);
 await user.click(screen.getByRole("button",{name:"Todos los ítems"}));
 expect(screen.getByRole("heading",{name:"Sin cambios · Sin cambios"})).toBeInTheDocument();
 await user.type(screen.getByRole("searchbox"),"Pizza");
 expect(screen.getByRole("heading",{name:"Margarita · Modificado"})).toBeInTheDocument();
 expect(screen.queryByRole("heading",{name:"Sin cambios · Sin cambios"})).not.toBeInTheDocument();
});
