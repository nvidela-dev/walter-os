import { render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { DrinksNavigation } from "@/app/drinks/drinks-navigation";

const context=vi.hoisted(()=>({path:"/drinks",query:"category=Cervezas&date=2026-10-15"}));
vi.mock("next/navigation", () => ({ usePathname: () => context.path, useSearchParams: () => new URLSearchParams(context.query) }));
it("uses exactly three category tabs and preserves category through staff navigation", () => {
  render(<DrinksNavigation />);
  const tabs = within(screen.getByRole("navigation", { name: "Categorías de bebidas" })).getAllByRole("link");
  expect(tabs).toHaveLength(3);
  expect(tabs.map((tab) => tab.textContent)).toEqual(["Alcoholes", "Cervezas", "Refrescos"]);
  expect(screen.getByRole("link", { name: "Cervezas" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: "Inventarios" })).toHaveAttribute("href", "/drinks?category=Cervezas");
  expect(screen.getByRole("link", { name: "Refrescos" })).toHaveAttribute("href", "/drinks?date=2026-10-15&category=Refrescos");
  expect(screen.queryByRole("link", { name: "Bebidas y objetivos" })).not.toBeInTheDocument();
});

it("switches categories through the dated list and keeps supplier links on the selected file",()=>{
 context.path="/drinks/documents/file-id/edit";render(<DrinksNavigation/>);
 expect(screen.getByRole("link",{name:"Refrescos"})).toHaveAttribute("href","/drinks?date=2026-10-15&category=Refrescos");
 expect(screen.getByRole("link",{name:"Por proveedor"})).toHaveAttribute("href","/drinks/documents/file-id?date=2026-10-15&view=suppliers&category=Cervezas");
 expect(screen.getByRole("link",{name:"Agregar bebida"})).toHaveAttribute("href","/drinks/new?document=file-id&category=Cervezas");
});
