import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import DrinkSummaryPage from "@/app/drinks/summary/page";

vi.mock("@/lib/queries/drinks", () => ({
  getDrinksInventory: () => Promise.resolve({week: "2026-10-13", items: [
    {id: "a", name: "Cola", category: "Refrescos", location: "Bar", quantity: "0.00", countedUnit: "botella", unit: "botella"},
    {id: "b", name: "Agua", category: "Refrescos", location: "Bar", quantity: null, countedUnit: null, unit: "botella"},
    {id: "c", name: "Cerveza", category: "Cervezas", location: "Bar", quantity: "9.00", countedUnit: "botella", unit: "botella"},
  ]}),
  getDrinkSuppliers: () => Promise.resolve([{itemId: "a", providerId: "1", name: "Primero"}, {itemId: "a", providerId: "2", name: "Segundo"}]),
}));
it("shows selected-category counts once per item, keeping zero and unknown distinct", async () => {
  render(await DrinkSummaryPage({searchParams: Promise.resolve({category: "Refrescos"})}));
  expect(screen.getAllByText("Cola")).toHaveLength(1);
  expect(screen.getByText("0.00 botella")).toBeInTheDocument();
  expect(screen.getByText("Sin revisar")).toBeInTheDocument();
  expect(screen.getByRole("heading", {name: "Sin proveedor"})).toBeInTheDocument();
  expect(screen.getByRole("heading", {name: "Varios proveedores: Primero, Segundo"})).toBeInTheDocument();
  expect(screen.queryByText("Cerveza")).not.toBeInTheDocument();
});
