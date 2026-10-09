import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";

import { DrinksCounter } from "@/app/drinks/drinks-counter";
import { saveDrinkCounts } from "@/lib/actions/drinks";
import type { DrinkRow } from "@/lib/queries/drinks";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/actions/drinks", () => ({ saveDrinkCounts: vi.fn() }));

const items: DrinkRow[] = [
  { id: "a", name: "Cola", unit: "unidad", location: "Bar", targetQuantity: "12.00", targetUnit: "unidad", quantity: null, countedUnit: null, countedAt: null, previousQuantity: null, previousUnit: null },
  { id: "b", name: "Agua", unit: "unidad", location: "Bar", targetQuantity: null, targetUnit: null, quantity: "3.00", countedUnit: "unidad", countedAt: new Date(), previousQuantity: "2.00", previousUnit: "unidad" },
];
beforeEach(() => { vi.clearAllMocks(); });

it("saves entered zero without treating blank drinks as zero", async () => {
  const user = userEvent.setup();
  vi.mocked(saveDrinkCounts).mockResolvedValue({ ok: true, data: undefined });
  render(<DrinksCounter week="2026-10-06" items={items} />);
  await user.type(screen.getByRole("spinbutton", { name: "Conteo de Cola en Bar" }), "0");
  await user.click(screen.getByRole("button", { name: "Guardar conteos (1)" }));
  expect(saveDrinkCounts).toHaveBeenCalledWith([{ itemId: "a", quantity: "0", unit: "unidad" }]);
  expect(await screen.findByRole("status")).toHaveTextContent("Conteos guardados");
});

it("preserves entered counts after a failed save and filters pending drinks", async () => {
  const user = userEvent.setup();
  vi.mocked(saveDrinkCounts).mockResolvedValue({ ok: false, error: "No se pudo guardar" });
  render(<DrinksCounter week="2026-10-06" items={items} />);
  await user.type(screen.getByRole("spinbutton", { name: "Conteo de Cola en Bar" }), "6");
  await user.click(screen.getByRole("button", { name: "Guardar conteos (1)" }));
  expect(await screen.findByText("No se pudo guardar")).toBeInTheDocument();
  expect(screen.getByRole("spinbutton", { name: "Conteo de Cola en Bar" })).toHaveValue(6);
  await user.click(screen.getByRole("checkbox", { name: "Solo pendientes" }));
  expect(screen.queryByRole("spinbutton", { name: "Conteo de Agua en Bar" })).not.toBeInTheDocument();
});
