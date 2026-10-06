import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/actions/inventory", () => ({ saveInventory: vi.fn(), removeInventoryEntry: vi.fn() }));

import { InventoryList } from "@/app/inventory/list/list";
import { removeInventoryEntry, saveInventory } from "@/lib/actions/inventory";

const groups = [{ id: "fridge", number: 1, name: "Cocina", rows: [{ id: "product", name: "Arroz", unit: "kg", providers: [], current: { quantity: "2", unit: "kg", recordedAt: "2026-10-06T12:00:00Z" }, previous: null, difference: null }] }];
beforeEach(() => { vi.clearAllMocks(); });
it("shows a plain grouped list and saves a corrected quantity", async () => {
  vi.mocked(saveInventory).mockResolvedValue({ ok: true, data: undefined });
  render(<InventoryList groups={groups} />);
  expect(screen.getByRole("heading", { name: "Heladera 1 · Cocina" })).toBeInTheDocument();
  expect(screen.getByText("Arroz — 2 kg")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Editar" }));
  fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "0" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  await waitFor(() => { expect(saveInventory).toHaveBeenCalledWith({ fridgeId: "fridge", counts: [{ productId: "product", quantity: "0" }] }); });
  await waitFor(() => expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument());
});
it("preserves corrections when saving fails", async () => {
  vi.mocked(saveInventory).mockResolvedValue({ ok: false, error: "Sin conexión" });
  render(<InventoryList groups={groups} />);
  fireEvent.click(screen.getByRole("button", { name: "Editar" }));
  fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "3" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
  expect(await screen.findByText("Sin conexión")).toBeInTheDocument();
  expect(screen.getByRole("spinbutton")).toHaveValue(3);
});

it("requires inline removal confirmation and targets only this fridge", async () => {
  vi.mocked(removeInventoryEntry).mockResolvedValue({ ok: true, data: undefined });
  render(<InventoryList groups={groups} />);
  fireEvent.click(screen.getByRole("button", { name: "Quitar" }));
  expect(removeInventoryEntry).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Confirmar quitar" }));
  await waitFor(() => { expect(removeInventoryEntry).toHaveBeenCalledWith({ fridgeId: "fridge", productId: "product" }); });
});
