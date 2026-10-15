import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

import { AddDrinkForm } from "@/app/drinks/new/add-drink-form";
import { addDrinkItem } from "@/lib/actions/drinks";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/actions/drinks", () => ({ addDrinkItem: vi.fn() }));

it("adds a drink without exposing target, restore or provider controls and retains input on error", async () => {
  const user = userEvent.setup();
  vi.mocked(addDrinkItem).mockResolvedValue({ ok: false, error: "Revisá la bebida" });
  render(<AddDrinkForm category="Refrescos" units={[{ id: "u", code: "unidad", name: "Unidad" }]} locations={["Bar"]} />);
  await user.type(screen.getByLabelText("Nombre"), "Limonada");
  await user.selectOptions(screen.getByLabelText("Unidad del producto"), "u");
  await user.click(screen.getByRole("button", { name: "Agregar bebida" }));
  expect(addDrinkItem).toHaveBeenCalledWith({ name: "Limonada", location: "Bar", unitId: "u", category: "Refrescos", countUnit: "botella" });
  expect(await screen.findByText("Revisá la bebida")).toBeInTheDocument();
  expect(screen.getByLabelText("Nombre")).toHaveValue("Limonada");
  expect(screen.queryByText(/Guardar objetivo|Restaurar|proveedor/i)).not.toBeInTheDocument();
  vi.mocked(addDrinkItem).mockResolvedValue({ ok: true, data: undefined });
  await user.click(screen.getByRole("button", { name: "Agregar bebida" }));
  expect(await screen.findByRole("status")).toHaveTextContent("Bebida agregada");
  expect(screen.getByLabelText("Nombre")).toHaveValue("");
});
