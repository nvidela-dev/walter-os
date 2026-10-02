import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

vi.mock("@/lib/actions/manual-catalogue", () => ({ addManualCatalogue: vi.fn() }));

import { ManualReview } from "@/app/inventory/review/review";
import { addManualCatalogue } from "@/lib/actions/manual-catalogue";

const props = { userId: "reviewer", photos: ["data:image/jpeg;base64,AAAA", "data:image/jpeg;base64,BBBB"], fridges: [{ id: "fridge", number: 1, name: null }], units: [{ id: "unit", code: "unidad", name: "Unidad" }], catalogue: [] };
beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); });
it("requires fridge and unit review before the separate batch confirmation", async () => {
  vi.mocked(addManualCatalogue).mockResolvedValue({ ok: true, data: undefined });
  render(<ManualReview {...props} />);
  expect(await screen.findByText("Ñoquis mixtos - 2")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Revisado · siguiente" })).toBeDisabled();
  fireEvent.change(screen.getByLabelText("¿En qué heladera va?"), { target: { value: "fridge" } });
  fireEvent.change(screen.getByLabelText("Unidad de inventario"), { target: { value: "unit" } });
  fireEvent.click(screen.getByRole("button", { name: "Revisado · siguiente" }));
  expect(addManualCatalogue).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Agregar lote al catálogo" }));
  await waitFor(() => { expect(addManualCatalogue).toHaveBeenCalledWith([{ name: "Ñoquis mixtos", fridgeId: "fridge", unitId: "unit", productId: null }]); });
  expect(await screen.findByRole("status")).toHaveTextContent("Lote agregado");
});
it("retains the reviewed batch after a failed save", async () => {
  vi.mocked(addManualCatalogue).mockResolvedValue({ ok: false, error: "Sin conexión" });
  render(<ManualReview {...props} />);
  await screen.findByText("Ñoquis mixtos - 2");
  fireEvent.change(screen.getByLabelText("¿En qué heladera va?"), { target: { value: "fridge" } });
  fireEvent.change(screen.getByLabelText("Unidad de inventario"), { target: { value: "unit" } });
  fireEvent.click(screen.getByRole("button", { name: "Revisado · siguiente" }));
  fireEvent.click(screen.getByRole("button", { name: "Agregar lote al catálogo" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Sin conexión");
  expect(screen.getByRole("button", { name: "Agregar lote al catálogo" })).toBeEnabled();
});
