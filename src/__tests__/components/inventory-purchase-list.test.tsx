import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";

import { PurchaseList } from "@/app/inventory/purchases/purchase-list";
import type { PurchaseProduct } from "@/lib/inventory/purchases";

const product: PurchaseProduct = { id: "rice", name: "Arroz", unit: "kg", comparison: { stock: "8", target: "12", shortage: "4", issues: [] }, suppliers: [{ id: "a", name: "Proveedor A" }, { id: "b", name: "Proveedor B" }] };
it("moves a shortage into exactly one supplier group, and supports changing or clearing that choice", () => {
  render(<PurchaseList products={[product]} />);
  expect(screen.getByRole("heading", { name: "Pendientes de resolver (1)" })).toBeInTheDocument();
  fireEvent.change(screen.getByRole("combobox", { name: "Proveedor para Arroz" }), { target: { value: "b" } });
  const heading = screen.getByRole("heading", { name: "Proveedor B" });
  const section = heading.closest("section");
  if (section === null) throw new Error("Missing supplier section");
  expect(within(section).getByText("Comprar 4 kg")).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: /Pendientes de resolver/ })).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "a" } });
  expect(screen.getByRole("heading", { name: "Proveedor A" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Proveedor B" })).not.toBeInTheDocument();
  expect(screen.getAllByText("Comprar 4 kg")).toHaveLength(1);
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "" } });
  expect(screen.getByRole("heading", { name: "Pendientes de resolver (1)" })).toBeInTheDocument();
});
it("keeps incomplete products separate without fabricating quantities, and shows excess stock as no purchase", () => {
  render(<PurchaseList products={[
    { ...product, id: "unknown", name: "Sin contar", comparison: { stock: null, target: "12", shortage: null, issues: ["missing-count", "unit-mismatch"] } },
    { ...product, id: "unplanned", name: "Sin objetivo", comparison: { stock: "8", target: null, shortage: null, issues: ["missing-target"] } },
    { ...product, id: "enough", name: "Suficiente", suppliers: [], comparison: { stock: "15", target: "12", shortage: "0", issues: [] } },
  ]} />);
  expect(screen.getByText("Hay heladeras sin contar. No se asumió stock cero.")).toBeInTheDocument();
  expect(screen.getByText("Falta definir el stock objetivo.")).toBeInTheDocument();
  expect(screen.getByText(/Las unidades de los conteos/)).toBeInTheDocument();
  expect(screen.queryByText(/Comprar/)).not.toBeInTheDocument();
  expect(screen.getByText("Sin faltante a comprar (1)")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Sin objetivo" })).toHaveAttribute("href", "/inventory/items/unplanned");
});
it("invalidates a selection when a refreshed product no longer links that supplier", () => {
  const view = render(<PurchaseList products={[product]} />);
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "b" } });
  view.rerender(<PurchaseList products={[{ ...product, suppliers: [{ id: "a", name: "Proveedor A" }, { id: "c", name: "Proveedor C" }] }]} />);
  expect(screen.queryByRole("heading", { name: "Proveedor B" })).not.toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Pendientes de resolver (1)" })).toBeInTheDocument();
  expect(screen.getByRole("combobox")).toHaveValue("");
});
