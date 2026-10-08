import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

vi.mock("@/lib/actions/inventory", () => ({ createFridge: vi.fn() }));

import { FridgeForm } from "@/app/inventory/fridge-form";
import { createFridge } from "@/lib/actions/inventory";

beforeEach(() => {
  vi.clearAllMocks();
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
it("opens the creation form from the accessible plus button and closes on cancel", () => {
  render(<FridgeForm />);
  fireEvent.click(screen.getByRole("button", { name: "Agregar heladera" }));
  expect(screen.getByRole("dialog")).toHaveAttribute("open");
  fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
  expect(document.querySelector("dialog")).not.toHaveAttribute("open");
});
it("saves the fridge and closes only on success, retaining input on failure", async () => {
  vi.mocked(createFridge).mockResolvedValueOnce({ ok: false, error: "Sin conexión" }).mockResolvedValueOnce({ ok: true, data: undefined });
  render(<FridgeForm />);
  fireEvent.click(screen.getByRole("button", { name: "Agregar heladera" }));
  fireEvent.change(screen.getByLabelText("Número"), { target: { value: "5" } });
  fireEvent.change(screen.getByLabelText("Nombre (opcional)"), { target: { value: "Freezer" } });
  fireEvent.submit(document.querySelector("form") ?? document.body);
  expect(await screen.findByText("Sin conexión")).toBeInTheDocument();
  expect(screen.getByRole("dialog")).toHaveAttribute("open");
  expect(screen.getByLabelText("Número")).toHaveValue(5);
  fireEvent.submit(document.querySelector("form") ?? document.body);
  await waitFor(() => { expect(document.querySelector("dialog")).not.toHaveAttribute("open"); });
  expect(createFridge).toHaveBeenLastCalledWith({ number: "5", name: "Freezer" });
});
