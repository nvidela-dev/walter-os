import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

vi.mock("@/lib/auth/access", () => ({ getCurrentGroup: vi.fn() }));
vi.mock("@/lib/queries/inventory-targets", () => ({ getInventoryTargetProduct: vi.fn() }));
vi.mock("@/lib/actions/inventory-targets", () => ({ setInventoryTarget: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import { TargetStock } from "@/app/inventory/items/[id]/target-stock";
import { getCurrentGroup } from "@/lib/auth/access";
import { getInventoryTargetProduct } from "@/lib/queries/inventory-targets";

const product = { id: "product", name: "Arroz", unit: "kg", target: { id: 1, quantity: "12.00", unit: "kg", recordedAt: new Date("2026-10-07T12:00:00Z") } };
it("shows global targets and their history to Kitchen without target editing controls", async () => {
  vi.mocked(getCurrentGroup).mockResolvedValue("kitchen");
  vi.mocked(getInventoryTargetProduct).mockResolvedValue(product);
  render(await TargetStock({ productId: "product" }));
  expect(screen.getByText("12.00 kg")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Historial de objetivos" })).toHaveAttribute("href", "/inventory/items/product/targets");
  expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
});
it("lets Admin set an absent target without suggesting a quantity", async () => {
  vi.mocked(getCurrentGroup).mockResolvedValue("admin");
  vi.mocked(getInventoryTargetProduct).mockResolvedValue({ ...product, target: null });
  render(await TargetStock({ productId: "product" }));
  expect(screen.getByText("Sin objetivo definido")).toBeInTheDocument();
  expect(screen.getByRole("spinbutton")).toHaveValue(null);
});
it("keeps the old unit visible but requires a fresh target after a unit change", async () => {
  vi.mocked(getCurrentGroup).mockResolvedValue("admin");
  vi.mocked(getInventoryTargetProduct).mockResolvedValue({ ...product, unit: "unidad" });
  render(await TargetStock({ productId: "product" }));
  expect(screen.getByText("12.00 kg")).toBeInTheDocument();
  expect(screen.getByLabelText("Cantidad objetivo (unidad)")).toHaveValue(null);
  expect(screen.getByText(/La unidad del producto cambió/)).toBeInTheDocument();
});
