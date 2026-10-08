import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

vi.mock("@/lib/queries/inventory-runs", () => ({ getInventoryRuns: vi.fn(), getInventoryRun: vi.fn() }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("Not found"); } }));

import InventoryHistoryDetail from "@/app/inventory/history/[id]/page";
import HistoryPage from "@/app/inventory/history/page";
import { getInventoryRun, getInventoryRuns, type InventoryRun } from "@/lib/queries/inventory-runs";

const run: InventoryRun = { id: 1, day: "2026-10-06", initial: false, entries: [{ runId: 1, fridgeId: "fridge", productId: "rice", fridgeNumber: 1, fridgeName: "Cocina", name: "Arroz", note: "Paquete abierto", quantity: "8.00", unit: "kg", difference: "-2.00", recordedAt: new Date("2026-10-06T12:00:00Z"), observationId: 1 }] };
it("links each history date to its own page without expanding inline quantities", async () => {
  vi.mocked(getInventoryRuns).mockResolvedValue({ runs: [{ id: 1, day: run.day, initial: false }], hasNext: true });
  render(await HistoryPage({ searchParams: Promise.resolve({}) }));
  expect(screen.getByRole("link", { name: "Martes 6 de octubre" })).toHaveAttribute("href", "/inventory/history/1");
  expect(screen.queryByText(/Arroz/)).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Más antiguos →" })).toHaveAttribute("href", "/inventory/history?page=2");
});
it("shows the selected inventory's snapshot, notes and prior-run change with a history back link", async () => {
  vi.mocked(getInventoryRun).mockResolvedValue(run);
  render(await InventoryHistoryDetail({ params: Promise.resolve({ id: "1" }) }));
  expect(getInventoryRun).toHaveBeenCalledWith(1);
  expect(screen.getByRole("heading", { name: "Martes 6 de octubre" })).toBeInTheDocument();
  expect(screen.getByText("Arroz — 8.00 kg")).toBeInTheDocument();
  expect(screen.getByText("-2")).toBeInTheDocument();
  expect(screen.getByText("Paquete abierto")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "← Historial de inventarios" })).toHaveAttribute("href", "/inventory/history");
});
it("handles empty initial inventories and unknown inventory IDs", async () => {
  vi.mocked(getInventoryRun).mockResolvedValue({ ...run, initial: true, entries: [] });
  render(await InventoryHistoryDetail({ params: Promise.resolve({ id: "1" }) }));
  expect(screen.getByText("Inventario inicial")).toBeInTheDocument();
  expect(screen.getByText("Este inventario todavía no tiene conteos guardados.")).toBeInTheDocument();
  vi.mocked(getInventoryRun).mockResolvedValue(null);
  await expect(InventoryHistoryDetail({ params: Promise.resolve({ id: "999" }) })).rejects.toThrow("Not found");
  await expect(InventoryHistoryDetail({ params: Promise.resolve({ id: "invalid" }) })).rejects.toThrow("Not found");
});
