import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";

import { PlanList } from "@/app/inventory-plan/plan-list";
import { setInventoryTarget } from "@/lib/actions/inventory-targets";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/actions/inventory-targets", () => ({ setInventoryTarget: vi.fn() }));

const items = [
  { id: "a", name: "Arroz", unit: "kg", quantity: null, targetUnit: null, targetId: null, locations: [{ id: "f1", number: 1, name: "Secos" }] },
  { id: "b", name: "Atún", unit: "unidad", quantity: "0.00", targetUnit: "unidad", targetId: 1, locations: [{ id: "f2", number: 2, name: "Conservas" }] },
  { id: "c", name: "Sal", unit: "pack", quantity: "3.00", targetUnit: "kg", targetId: 2, locations: [{ id: "f1", number: 1, name: "Secos" }] },
];

beforeEach(() => { vi.clearAllMocks(); });

it("counts zero as planned, flags changed units, and filters missing products and accent-insensitive search", async () => {
  const user = userEvent.setup();
  render(<PlanList items={items} />);
  expect(screen.getByRole("status")).toHaveTextContent("1 de 3");
  expect(within(screen.getByRole("region", { name: "Sal" })).getByRole("spinbutton")).toHaveValue(null);
  await user.click(screen.getByRole("checkbox"));
  expect(screen.queryByRole("region", { name: "Atún" })).not.toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Arroz" })).toBeInTheDocument();
  await user.click(screen.getByRole("checkbox"));
  await user.type(screen.getByRole("searchbox"), "atun");
  expect(screen.getByRole("region", { name: "Atún" })).toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "Arroz" })).not.toBeInTheDocument();
});

it("saves the entered target and retains unsaved input on failure", async () => {
  const user = userEvent.setup();
  vi.mocked(setInventoryTarget).mockResolvedValue({ ok: false, error: "No se pudo guardar" });
  render(<PlanList items={items} />);
  const row = within(screen.getByRole("region", { name: "Arroz" }));
  await user.type(row.getByRole("spinbutton"), "12");
  await user.click(row.getByRole("button"));
  expect(setInventoryTarget).toHaveBeenCalledWith({ productId: "a", quantity: "12" });
  expect(await row.findByText("No se pudo guardar")).toBeInTheDocument();
  expect(row.getByRole("spinbutton")).toHaveValue(12);
  vi.mocked(setInventoryTarget).mockResolvedValue({ ok: true, data: undefined });
  await user.click(row.getByRole("button"));
  expect(await row.findByRole("status")).toBeInTheDocument();
});

it("groups products by fridge and keeps a shared product target visible in each location", () => {
  render(<PlanList items={[{ id: "a", name: "Arroz", unit: "kg", quantity: null, targetUnit: null, targetId: null, locations: [{ id: "f2", number: 2, name: "Conservas" }, { id: "f1", number: 1, name: "Secos" }] }]} />);
  expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual(["Heladera 1 · Secos", "Heladera 2 · Conservas"]);
  expect(screen.getAllByRole("region", { name: "Arroz" })).toHaveLength(2);
  expect(screen.getByRole("status")).toHaveTextContent("0 de 1 productos");
  expect(screen.getAllByText(/El objetivo es compartido/)).toHaveLength(2);
});
