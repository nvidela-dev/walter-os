import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/actions/inventory", () => ({ startInventoryRun: vi.fn() }));

import { RunControls } from "@/app/inventory/run-controls";
import { startInventoryRun } from "@/lib/actions/inventory";

it("starts a fresh shared daily inventory without copying previous quantities", async () => {
  vi.mocked(startInventoryRun).mockResolvedValue({ ok: true, data: undefined });
  render(<RunControls day="2026-10-06" today="2026-10-13" />);
  fireEvent.click(screen.getByRole("button", { name: "Comenzar inventario semanal" }));
  await waitFor(() => { expect(startInventoryRun).toHaveBeenCalled(); });
});
it("continues today's run instead of offering a duplicate", () => {
  render(<RunControls day="2026-10-06" today="2026-10-07" />);
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  expect(screen.getByText("Ya hay un inventario de esta semana. ¿Querés editarlo?")).toBeInTheDocument();
});
