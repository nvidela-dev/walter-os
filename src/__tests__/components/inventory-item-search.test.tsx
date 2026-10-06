import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));

import { ItemSearch } from "@/app/inventory/item-search";

it("autocompletes accented inventory names and opens the selected detail by keyboard", () => {
  render(<ItemSearch items={[{ id: "rice", name: "Arroz" }, { id: "gnocchi", name: "Ñoquis" }]} />);
  const input = screen.getByRole("combobox");
  fireEvent.change(input, { target: { value: "noq" } });
  expect(screen.getByRole("option")).toHaveTextContent("Ñoquis");
  expect(screen.getByRole("link", { name: "Ñoquis" })).toHaveAttribute("href", "/inventory/items/gnocchi");
  fireEvent.keyDown(input, { key: "Enter" });
  expect(mocks.push).toHaveBeenCalledWith("/inventory/items/gnocchi");
});
it("shows no-match feedback and closes suggestions with Escape", () => {
  render(<ItemSearch items={[{ id: "rice", name: "Arroz" }]} />);
  const input = screen.getByRole("combobox");
  fireEvent.change(input, { target: { value: "unknown" } });
  expect(screen.getByRole("status")).toHaveTextContent("No hay productos");
  fireEvent.keyDown(input, { key: "Escape" });
  expect(input).toHaveAttribute("aria-expanded", "false");
});
