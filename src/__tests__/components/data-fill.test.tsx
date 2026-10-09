import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";

import { ProviderGame } from "@/app/data-fill/provider-game";
import { assignProductProvider } from "@/lib/actions/data-fill";

vi.mock("@/lib/actions/data-fill", () => ({ assignProductProvider: vi.fn() }));
const products = [{ id: "a", name: "Arroz", unit: "kg" }, { id: "b", name: "Aceite", unit: "unidad" }];
const suppliers = [{ id: "p", name: "Almacén" }];

beforeEach(() => { vi.clearAllMocks(); });

it("keeps skipped products pending and advances only after saving", async () => {
  const user = userEvent.setup();
  vi.mocked(assignProductProvider).mockResolvedValue({ ok: true, data: undefined });
  render(<ProviderGame initialProducts={products} suppliers={suppliers} />);
  await user.click(screen.getByRole("button", { name: "No sé, pasar" }));
  expect(screen.getByRole("heading", { name: "Aceite" })).toBeInTheDocument();
  expect(assignProductProvider).not.toHaveBeenCalled();
  await user.click(screen.getByRole("radio", { name: "Almacén" }));
  await user.click(screen.getByRole("button", { name: /Guardar y seguir/ }));
  expect(assignProductProvider).toHaveBeenCalledWith({ productId: "b", providerId: "p" });
  expect(await screen.findByRole("heading", { name: "Arroz" })).toBeInTheDocument();
  expect(screen.getByText("1 completado en esta visita")).toBeInTheDocument();
  await user.click(screen.getByRole("radio", { name: "Almacén" }));
  await user.click(screen.getByRole("button", { name: /Guardar y seguir/ }));
  expect(await screen.findByRole("heading", { name: "¡Todo listo!" })).toBeInTheDocument();
});

it("retains the product and selection after a failed save", async () => {
  const user = userEvent.setup();
  vi.mocked(assignProductProvider).mockResolvedValue({ ok: false, error: "Reintentá" });
  render(<ProviderGame initialProducts={products} suppliers={suppliers} />);
  await user.click(screen.getByRole("radio", { name: "Almacén" }));
  await user.click(screen.getByRole("button", { name: /Guardar y seguir/ }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Reintentá");
  expect(screen.getByRole("heading", { name: "Arroz" })).toBeInTheDocument();
  expect(screen.getByRole("radio")).toBeChecked();
  expect(screen.getByText("0 completados en esta visita")).toBeInTheDocument();
});
