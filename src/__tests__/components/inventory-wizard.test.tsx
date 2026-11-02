import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

vi.mock("@/lib/actions/inventory", () => ({ saveInventory: vi.fn(), startInventoryRun: vi.fn() }));

import { InventoryWizard } from "@/app/inventory/new/wizard";
import { saveInventory, startInventoryRun } from "@/lib/actions/inventory";

const groups = [{ id: "fridge", number: 1, name: "Cocina", rows: [{ id: "product", name: "Arroz", unit: "kg", note: null, providers: [], current: { quantity: "12", unit: "kg", recordedAt: "2026-10-06T12:00:00Z" }, previous: null, difference: null }] }];
beforeEach(() => {
  const storage = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => { storage.set(key, value); },
    removeItem: (key: string) => { storage.delete(key); },
  });
  vi.clearAllMocks();
  vi.mocked(startInventoryRun).mockResolvedValue({ ok: true, data: undefined });
  vi.mocked(saveInventory).mockResolvedValue({ ok: true, data: undefined });
});
it("starts from a separate intro, leaves new counts blank, and records explicit zero", async () => {
  render(<InventoryWizard userId="user" groups={groups} today="2026-10-13" continuing={false} />);
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
  render(<InventoryWizard userId="user" groups={groups} today="2026-10-07" continuing />);
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
  render(<InventoryWizard userId="user" groups={groups} today="2026-10-13" continuing={false} />);
  fireEvent.click(screen.getByRole("button", { name: "Comenzar inventario semanal" }));
  fireEvent.click(await screen.findByRole("button", { name: "Guardar y terminar" }));
  expect(await screen.findByText("1 productos quedaron sin revisar. No se registraron como cero.")).toBeInTheDocument();
  expect(saveInventory).not.toHaveBeenCalled();
});

it("restores unsaved quantities and the current step after leaving", async () => {
  const view = render(<InventoryWizard userId="user" groups={groups} today="2026-10-13" continuing={false} />);
  fireEvent.click(screen.getByRole("button", { name: "Comenzar inventario semanal" }));
  fireEvent.change(await screen.findByRole("spinbutton"), { target: { value: "7" } });
  view.unmount();
  render(<InventoryWizard userId="user" groups={groups} today="2026-10-14" continuing />);
  expect(await screen.findByRole("spinbutton")).toHaveValue(7);
  expect(saveInventory).not.toHaveBeenCalled();
});
it("requires confirmation to discard and preserves already saved counts", async () => {
  const view = render(<InventoryWizard userId="user" groups={groups} today="2026-10-13" continuing />);
  fireEvent.click(screen.getByRole("button", { name: "Editar inventario de la semana" }));
  fireEvent.change(await screen.findByRole("spinbutton"), { target: { value: "0" } });
  fireEvent.click(screen.getByRole("button", { name: "Descartar borrador" }));
  fireEvent.click(screen.getByRole("button", { name: "Seguir editando" }));
  expect(screen.getByRole("spinbutton")).toHaveValue(0);
  fireEvent.click(screen.getByRole("button", { name: "Descartar borrador" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirmar descarte" }));
  view.unmount();
  render(<InventoryWizard userId="user" groups={groups} today="2026-10-13" continuing />);
  fireEvent.click(screen.getByRole("button", { name: "Editar inventario de la semana" }));
  expect(await screen.findByRole("spinbutton")).toHaveValue(12);
  expect(saveInventory).not.toHaveBeenCalled();
});
it("keeps drafts separate for different users and inventory weeks", async () => {
  const view = render(<InventoryWizard userId="user" groups={groups} today="2026-10-13" continuing={false} />);
  fireEvent.click(screen.getByRole("button", { name: "Comenzar inventario semanal" }));
  fireEvent.change(await screen.findByRole("spinbutton"), { target: { value: "7" } });
  view.unmount();
  const other = render(<InventoryWizard userId="other" groups={groups} today="2026-10-13" continuing={false} />);
  expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  other.unmount();
  render(<InventoryWizard userId="user" groups={groups} today="2026-10-20" continuing={false} />);
  expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
});
it("warns when browser storage fails while retaining the entered quantities", async () => {
  render(<InventoryWizard userId="user" groups={groups} today="2026-10-13" continuing={false} />);
  fireEvent.click(screen.getByRole("button", { name: "Comenzar inventario semanal" }));
  const field = await screen.findByRole("spinbutton");
  vi.spyOn(localStorage, "setItem").mockImplementation(() => { throw new Error("storage full"); });
  fireEvent.change(field, { target: { value: "9" } });
  expect(field).toHaveValue(9);
  expect(screen.getByText(/No se pudo guardar el borrador/)).toBeInTheDocument();
});

it("shows a dismissible draft notice without starting the active inventory on entry", async () => {
  render(<InventoryWizard userId="user" groups={groups} today="2026-10-13" continuing={false} />);
  expect(screen.getByRole("complementary", { name: "Aviso sobre el borrador" })).toHaveTextContent("no se aplican al inventario activo");
  fireEvent.click(screen.getByRole("button", { name: "Entendido" }));
  expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Comenzar inventario semanal" }));
  fireEvent.change(await screen.findByRole("spinbutton"), { target: { value: "3" } });
  expect(startInventoryRun).not.toHaveBeenCalled();
  expect(saveInventory).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Guardar y terminar" }));
  await waitFor(() => { expect(saveInventory).toHaveBeenCalled(); });
  expect(startInventoryRun).toHaveBeenCalledOnce();
});
