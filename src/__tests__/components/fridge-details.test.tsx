import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/actions/inventory", () => ({ updateFridgeDetails: vi.fn() }));

import { FridgeDetails } from "@/app/inventory/fridge-details";
import { updateFridgeDetails } from "@/lib/actions/inventory";

it("edits fridge name and commentary and preserves inputs on failure", async () => {
  vi.mocked(updateFridgeDetails).mockResolvedValueOnce({ ok: false, error: "Sin conexión" }).mockResolvedValueOnce({ ok: true, data: undefined });
  render(<FridgeDetails fridge={{ id: "fridge", name: "Cocina", commentary: "Puerta" }} />);
  expect(screen.getByText("Comentario: Puerta")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Editar nombre y comentario" }));
  fireEvent.change(screen.getByLabelText("Nombre de la heladera"), { target: { value: "Freezer" } });
  fireEvent.change(screen.getByLabelText("Comentario de la heladera"), { target: { value: "Revisar" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar heladera" }));
  expect(await screen.findByText("Sin conexión")).toBeInTheDocument();
  expect(screen.getByLabelText("Comentario de la heladera")).toHaveValue("Revisar");
  fireEvent.click(screen.getByRole("button", { name: "Guardar heladera" }));
  await waitFor(() => expect(screen.queryByLabelText("Nombre de la heladera")).not.toBeInTheDocument());
  expect(updateFridgeDetails).toHaveBeenLastCalledWith({ fridgeId: "fridge", name: "Freezer", commentary: "Revisar" });
});
