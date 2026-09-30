import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CountForm } from "@/app/inventory/[id]/count-form";
import { t } from "@/i18n";
import { saveInventory } from "@/lib/actions/inventory";
import type { InventoryRow } from "@/lib/queries/inventory";

vi.mock("@/lib/actions/inventory", () => ({ saveInventory: vi.fn() }));
const rows: InventoryRow[] = [{ id: "product1", name: "Cola", unit: "unidad", providers: [], current: { quantity: "12", unit: "unidad", recordedAt: "2026-09-30T12:00:00Z" }, previous: null, difference: null }, { id: "product2", name: "Water", unit: "unidad", providers: ["Provider"], current: null, previous: null, difference: null }];

beforeEach(() => { vi.mocked(saveInventory).mockReset(); });
describe("fast inventory entry", () => {
  it("shows missing history and submits explicit zero, excluding untouched fields", async () => {
    vi.mocked(saveInventory).mockResolvedValue({ ok: true, data: undefined });
    render(<CountForm fridgeId="fridge" rows={rows} />);
    expect(screen.getAllByText(t.inventory.noPrevious)).toHaveLength(2);
    expect(screen.getByText(t.inventory.noProvider)).toBeInTheDocument();
    const inputs = screen.getAllByRole("spinbutton");
    const first = inputs[0];
    if (!first) throw new Error("missing field");
    fireEvent.change(first, { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: t.inventory.save }));
    await waitFor(() => { expect(saveInventory).toHaveBeenCalledWith({ fridgeId: "fridge", counts: [{ productId: "product1", quantity: "0" }] }); });
    expect(await screen.findByRole("status")).toHaveTextContent(t.inventory.saved);
    expect(first).toHaveValue(null);
  });
  it("retains entered counts on network failure and does not show false success", async () => {
    vi.mocked(saveInventory).mockRejectedValue(new Error("offline"));
    render(<CountForm fridgeId="fridge" rows={rows} />);
    const first = screen.getAllByRole("spinbutton")[0];
    if (!first) throw new Error("missing field");
    fireEvent.change(first, { target: { value: "14" } });
    fireEvent.click(screen.getByRole("button", { name: t.inventory.save }));
    expect(await screen.findByText(t.errors.generic)).toBeInTheDocument();
    expect(first).toHaveValue(14);
    expect(screen.queryByText(t.inventory.saved)).not.toBeInTheDocument();
  });
});
