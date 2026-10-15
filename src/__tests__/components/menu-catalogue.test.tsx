import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

import { MenuCatalogue } from "@/app/menu/menu-catalogue";
import { MenuForm } from "@/app/menu/menu-form";
import { createMenuItem, updateMenuItem } from "@/lib/actions/menu";
import type { MenuItemRow } from "@/lib/types/menu";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
vi.mock("@/lib/actions/menu", () => ({ createMenuItem: vi.fn(), updateMenuItem: vi.fn(), saveMenuSection: vi.fn() }));
const base = { id: "i", name: "Corona 710 ml", description: null, sellPrice: "350", recipeId: null, recipeName: null, sectionId: "d", sectionName: "Cervezas", menuName: "Don Juan", priceOptions: [], sourceNote: null, reviewNote: null, sortOrder: 0 };
const items: MenuItemRow[] = [base, { ...base, id: "g-item", menuName: "Genüsse", sectionId: "g", sellPrice: "300" }];
it("keeps prices separate when switching between the two menus", async () => {
  const user = userEvent.setup();
  render(<MenuCatalogue items={items} sections={[{ id: "d", menuName: "Don Juan", name: "Cervezas", sortOrder: 0 }, { id: "g", menuName: "Genüsse", name: "Cervezas", sortOrder: 0 }]} />);
  expect(screen.getByText("$350")).toBeInTheDocument();
  expect(screen.queryByText("$300")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Genüsse" }));
  expect(screen.getByText("$300")).toBeInTheDocument();
  expect(screen.queryByText("$350")).not.toBeInTheDocument();
});
it("saves a sale item without a recipe or inventory link", async () => {
  const user = userEvent.setup();
  vi.mocked(createMenuItem).mockResolvedValue({ ok: true, data: { id: "new" } });
  render(<MenuForm sections={[]} />);
  await user.type(screen.getByLabelText(/Nombre/), "Plato nuevo");
  await user.type(screen.getByLabelText(/Precio/), "500");
  await user.click(screen.getByRole("button", { name: "Agregar ítem" }));
  expect(createMenuItem).toHaveBeenCalledWith(expect.objectContaining({ name: "Plato nuevo", sellPrice: "500", recipeId: null }));
});

it("edits an item price directly inside the central catalogue", async () => {
  const user = userEvent.setup();
  vi.mocked(updateMenuItem).mockResolvedValue({ ok: true, data: { id: "i" } });
  render(<MenuCatalogue items={items} sections={[{ id: "d", menuName: "Don Juan", name: "Cervezas", sortOrder: 0 }, { id: "g", menuName: "Genüsse", name: "Cervezas", sortOrder: 0 }]} />);
  await user.click(screen.getByText("Corona 710 ml"));
  const price = screen.getByRole("spinbutton", { name: "Precio de Venta ($)" });
  await user.clear(price);
  await user.type(price, "375");
  await user.click(screen.getByRole("button", { name: "Guardar" }));
  expect(updateMenuItem).toHaveBeenCalledWith("i", expect.objectContaining({ sellPrice: "375", sectionId: "d", recipeId: null }));
});
