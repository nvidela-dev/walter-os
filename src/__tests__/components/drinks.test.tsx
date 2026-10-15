import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";

import { DrinksCounter } from "@/app/drinks/drinks-counter";
import { saveDrinkCounts } from "@/lib/actions/drinks";
import type { DrinkRow } from "@/lib/queries/drinks";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push }) }));
vi.mock("@/lib/actions/drinks", () => ({ saveDrinkCounts: vi.fn() }));

const items: DrinkRow[] = [
  { id: "a", name: "Cola", unit: "unidad", location: "Bar", category: "Refrescos", targetQuantity: "12.00", targetUnit: "unidad", quantity: null, countedUnit: null, countedAt: null, previousQuantity: null, previousUnit: null },
  { id: "b", name: "Agua", unit: "unidad", location: "Bar", category: "Refrescos", targetQuantity: null, targetUnit: null, quantity: "3.00", countedUnit: "unidad", countedAt: new Date(), previousQuantity: "2.00", previousUnit: "unidad" },
];
beforeEach(() => { vi.clearAllMocks(); });

it("saves entered zero without treating blank drinks as zero", async () => {
  const user = userEvent.setup();
  vi.mocked(saveDrinkCounts).mockResolvedValue({ ok: true, data: undefined });
  render(<DrinksCounter category="Refrescos" week="2026-10-06" items={items} />);
  await user.type(screen.getByRole("spinbutton", { name: "Conteo de Cola en Bar" }), "0");
  await user.click(screen.getByRole("button", { name: "Guardar conteos (1)" }));
  expect(saveDrinkCounts).toHaveBeenCalledWith([{ itemId: "a", quantity: "0", unit: "unidad" }], "Refrescos");
  expect(push).toHaveBeenCalledWith("/drinks/summary?category=Refrescos");
});

it("preserves entered counts after a failed save and filters pending drinks", async () => {
  const user = userEvent.setup();
  vi.mocked(saveDrinkCounts).mockResolvedValue({ ok: false, error: "No se pudo guardar" });
  render(<DrinksCounter category="Refrescos" week="2026-10-06" items={items} />);
  await user.type(screen.getByRole("spinbutton", { name: "Conteo de Cola en Bar" }), "6");
  await user.click(screen.getByRole("button", { name: "Guardar conteos (1)" }));
  expect(await screen.findByText("No se pudo guardar")).toBeInTheDocument();
  expect(screen.getByRole("spinbutton", { name: "Conteo de Cola en Bar" })).toHaveValue(6);
  await user.click(screen.getByRole("checkbox", { name: "Solo pendientes" }));
  expect(screen.queryByRole("spinbutton", { name: "Conteo de Agua en Bar" })).not.toBeInTheDocument();
});


it("retains separate drafts across category tabs and saves only the selected category", async () => {
  const user = userEvent.setup();
  const first = items[0];
  const second = items[1];
  if (first === undefined || second === undefined) throw new Error("Missing fixtures");
  const alcohol = {...second, category: "Alcoholes"};
  const { rerender } = render(<DrinksCounter category="Refrescos" week="2026-10-13" items={[first]} />);
  await user.type(screen.getByRole("spinbutton", {name: "Conteo de Cola en Bar"}), "4");
  rerender(<DrinksCounter category="Alcoholes" week="2026-10-13" items={[alcohol]} />);
  expect(screen.queryByRole("spinbutton", {name: "Conteo de Cola en Bar"})).not.toBeInTheDocument();
  expect(screen.getByRole("button", {name: "Guardar conteos (0)"})).toBeDisabled();
  rerender(<DrinksCounter category="Refrescos" week="2026-10-13" items={[first]} />);
  expect(screen.getByRole("spinbutton", {name: "Conteo de Cola en Bar"})).toHaveValue(4);
});
