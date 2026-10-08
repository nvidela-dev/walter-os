import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/actions/inventory-targets", () => ({ setInventoryTarget: vi.fn() }));

import { TargetForm } from "@/app/inventory/items/[id]/target-form";
import { setInventoryTarget } from "@/lib/actions/inventory-targets";

beforeEach(() => { vi.clearAllMocks(); });
it("records an explicit zero target and displays confirmation only after saving", async () => {
  vi.mocked(setInventoryTarget).mockResolvedValue({ ok: true, data: undefined });
  render(<TargetForm productId="product" unit="kg" quantity="12" />);
  fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "0" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar objetivo" }));
  await waitFor(() => { expect(setInventoryTarget).toHaveBeenCalledWith({ productId: "product", quantity: "0" }); });
  expect(await screen.findByRole("status")).toHaveTextContent("El anterior queda en el historial");
});
it("retains the entered target on a failed save", async () => {
  vi.mocked(setInventoryTarget).mockResolvedValue({ ok: false, error: "Sin conexión" });
  render(<TargetForm productId="product" unit="kg" quantity={null} />);
  expect(screen.getByRole("spinbutton")).toHaveValue(null);
  fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "4.5" } });
  fireEvent.click(screen.getByRole("button", { name: "Guardar objetivo" }));
  expect(await screen.findByText("Sin conexión")).toBeInTheDocument();
  expect(screen.getByRole("spinbutton")).toHaveValue(4.5);
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});
