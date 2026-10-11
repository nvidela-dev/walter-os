import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

import { MatchingReview } from "@/app/product-matching/matching-review";
import { reviewProductMatch } from "@/lib/actions/product-matching";

vi.mock("@/lib/actions/product-matching", () => ({ reviewProductMatch: vi.fn() }));
const inventory = [{ id: "i", name: "Kassler", unit: "unidad" }];
const catalogue = [{ id: "c", name: "Kasler", unit: "kg", provider: "Elias" }];
beforeEach(() => { vi.clearAllMocks(); });
it("confirms, persists and reverses a reviewed conceptual match", async () => {
  vi.mocked(reviewProductMatch).mockResolvedValue({ ok: true, data: undefined });
  render(<MatchingReview inventory={inventory} catalogue={catalogue} decisions={[]} />);
  fireEvent.click(screen.getByText("Sí, corresponde"));
  await waitFor(() => { expect(reviewProductMatch).toHaveBeenCalledWith({ inventoryId: "i", catalogueId: "c", status: "accepted" }); });
  fireEvent.click(screen.getByRole("button", { name: /Revisados/ }));
  expect(await screen.findByText("✓ Confirmado por vos")).toBeInTheDocument();
  fireEvent.click(screen.getByText("Deshacer vínculo"));
  await waitFor(() => { expect(reviewProductMatch).toHaveBeenLastCalledWith({ inventoryId: "i", catalogueId: "c", status: "rejected" }); });
  fireEvent.click(screen.getByRole("button", { name: /Sin sugerencia/ }));
  fireEvent.click(screen.getByText("Buscar / cambiar"));
  expect(screen.getByText("Descartado por vos")).toBeInTheDocument();
});
it("keeps failed saves pending and shows the error", async () => {
  vi.mocked(reviewProductMatch).mockResolvedValue({ ok: false, error: "No guardado" });
  render(<MatchingReview inventory={inventory} catalogue={catalogue} decisions={[]} />);
  fireEvent.click(screen.getByText("Sí, corresponde"));
  expect(await screen.findByRole("alert")).toHaveTextContent("No guardado");
  expect(screen.getByText("Sí, corresponde")).toBeInTheDocument();
});
it("allows rejecting an automatic match and retains that decision after reload", () => {
  render(<MatchingReview inventory={[{ id: "i", name: "Kasler", unit: "unidad" }]} catalogue={catalogue} decisions={[{ inventoryId: "i", catalogueId: "c", status: "rejected" }]} />);
  fireEvent.click(screen.getByRole("button", { name: /Automáticos/ }));
  expect(screen.queryByText("Vínculo automático · pendiente de revisión")).not.toBeInTheDocument();
});
