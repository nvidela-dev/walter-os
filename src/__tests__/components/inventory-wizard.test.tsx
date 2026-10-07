import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

vi.mock("@/lib/actions/inventory", () => ({ saveInventory: vi.fn(), startInventoryRun: vi.fn() }));

import { InventoryWizard } from "@/app/inventory/new/wizard";
import { saveInventory, startInventoryRun } from "@/lib/actions/inventory";

const groups = [{ id: "fridge", number: 1, name: "Cocina", rows: [{ id: "product", name: "Arroz", unit: "kg", note: null, providers: [], current: { quantity: "12", unit: "kg", recordedAt: "2026-10-06T12:00:00Z" }, previous: null, difference: null }] }];
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(startInventoryRun).mockResolvedValue({ ok: true, data: undefined });
  vi.mocked(saveInventory).mockResolvedValue({ ok: true, data: undefined });
});
it("starts from a separate intro, leaves new counts blank, and records explicit zero", async () => {
  render(<InventoryWizard groups={groups} today="2026-10-13" continuing={false} />);
  expect(startInventoryRun).not.toHaveBeenCalled();
  expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Comenzar inventario semanal" }));
  const field = await screen.findByRole("spinbutton");
  expect(field).toHaveValue(null);
  fireEvent.change(field, { target: { value: "0" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar y terminar" }));
  await waitFor(() => { expect(saveInventory).toHaveBeenCalledWith({ fridgeId: "fridge", counts: [{ productId: "product", quantity: "0" }] }); });
  expect(await screen.findByRole("status")).toHaveTextContent("quedaron guardados");
});
it("keeps entered quantities on failure and does not advance", async () => {
  vi.mocked(saveInventory).mockResolvedValue({ ok: false, error: "Sin conexión" });
  render(<InventoryWizard groups={groups} today="2026-10-07" continuing />);
  fireEvent.click(screen.getByRole("button", { name: "Editar inventario de la semana" }));
  const field = await screen.findByRole("spinbutton");
  expect(field).toHaveValue(12);
  fireEvent.change(field, { target: { value: "9" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar y terminar" }));
  expect(await screen.findByText("Sin conexión")).toBeInTheDocument();
  expect(field).toHaveValue(9);
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});
it("leaves untouched items uncounted rather than recording zero", async () => {
  render(<InventoryWizard groups={groups} today="2026-10-13" continuing={false} />);
  fireEvent.click(screen.getByRole("button", { name: "Comenzar inventario semanal" }));
  fireEvent.click(await screen.findByRole("button", { name: "Guardar y terminar" }));
  expect(await screen.findByText("1 productos quedaron sin revisar. No se registraron como cero.")).toBeInTheDocument();
  expect(saveInventory).not.toHaveBeenCalled();
});
