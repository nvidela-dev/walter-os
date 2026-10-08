import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

vi.mock("@/app/inventory/items/[id]/target-stock", () => ({ TargetStock: () => null }));

vi.mock("@/lib/queries/inventory-items", () => ({ getInventoryItemDetail: vi.fn() }));

import ItemPage from "@/app/inventory/items/[id]/page";
import { getInventoryItemDetail } from "@/lib/queries/inventory-items";

const row = { id: "product", name: "Arroz", unit: "kg", note: null, providers: [], current: { quantity: "2", unit: "kg", recordedAt: "2026-10-13T12:00:00Z" }, previous: { quantity: "3", unit: "kg", recordedAt: "2026-10-06T12:00:00Z" }, difference: "-1" };
it("totals stock and changes across fridges and displays provider only in detail", async () => {
  vi.mocked(getInventoryItemDetail).mockResolvedValue({ name: "Arroz", day: "2026-10-13", initial: false, providers: ["Proveedor"], locations: [{ id: "one", number: 1, name: null, row }, { id: "two", number: 2, name: "Cocina", row: { ...row, current: { ...row.current, quantity: "5" }, difference: "2" } }] });
  render(await ItemPage({ params: Promise.resolve({ id: "product" }) }));
  expect(screen.getByText("7 kg")).toBeInTheDocument();
  expect(screen.getByText("+1")).toBeInTheDocument();
  expect(screen.getAllByText("Proveedor")).toHaveLength(2);
  expect(screen.getByRole("heading", { name: "Heladera 2 · Cocina" })).toBeInTheDocument();
});
it("does not assume uncounted locations are zero and hides the baseline change", async () => {
  vi.mocked(getInventoryItemDetail).mockResolvedValue({ name: "Arroz", day: "2026-10-06", initial: true, providers: [], locations: [{ id: "one", number: 1, name: null, row }, { id: "two", number: 2, name: null, row: { ...row, current: null, difference: null } }] });
  render(await ItemPage({ params: Promise.resolve({ id: "product" }) }));
  expect(screen.getByText("Total parcial: hay heladeras sin contar.")).toBeInTheDocument();
  expect(screen.getByText("Proveedor no asignado")).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Cambio de stock esta semana" })).not.toBeInTheDocument();
});
