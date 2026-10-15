import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

import { MatchingReview } from "@/app/product-matching/matching-review";
import { reviewProductMatch, setProductArchived } from "@/lib/actions/product-matching";

vi.mock("@/lib/actions/product-matching", () => ({ reviewProductMatch: vi.fn(), setProductArchived: vi.fn() }));
const inventory = [{ id: "i", name: "Kassler", unit: "unidad" }];
const catalogue = [{ id: "c", name: "Kasler", unit: "kg", provider: "Elias" }];
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(reviewProductMatch).mockResolvedValue({ ok: true, data: undefined });
  vi.mocked(setProductArchived).mockResolvedValue({ ok: true, data: undefined });
});
it("confirms and rejects a reviewed match", async () => {
  render(<MatchingReview inventory={inventory} catalogue={catalogue} decisions={[]} />);
  fireEvent.click(screen.getByRole("button", { name: "Confirmar Kasler" }));
  await waitFor(() => { expect(reviewProductMatch).toHaveBeenCalledWith({ inventoryId: "i", catalogueId: "c", status: "accepted" }); });
  expect(await screen.findByText("confirmado")).toBeInTheDocument();
  await waitFor(() => { expect(screen.getByRole("button", { name: "Descartar Kasler" })).toBeEnabled(); });
  fireEvent.click(screen.getByRole("button", { name: "Descartar Kasler" }));
  await waitFor(() => { expect(reviewProductMatch).toHaveBeenLastCalledWith({ inventoryId: "i", catalogueId: "c", status: "rejected" }); });
  fireEvent.click(screen.getByRole("button", { name: "catálogo completo" }));
  expect(screen.getByText("descartado")).toBeInTheDocument();
});
it("keeps failed reviews unchanged", async () => {
  vi.mocked(reviewProductMatch).mockResolvedValue({ ok: false, error: "No guardado" });
  render(<MatchingReview inventory={inventory} catalogue={catalogue} decisions={[]} />);
  fireEvent.click(screen.getByRole("button", { name: "Confirmar Kasler" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("No guardado");
  expect(screen.queryByText("confirmado")).not.toBeInTheDocument();
});
it("preserves rejected automatic matches across reload", () => {
  render(<MatchingReview inventory={[{ id: "i", name: "Kasler", unit: "unidad" }]} catalogue={catalogue} decisions={[{ inventoryId: "i", catalogueId: "c", status: "rejected" }]} />);
  expect(screen.queryByText("auto / revisar")).not.toBeInTheDocument();
});
it("archives and restores without losing the matching identity", async () => {
  render(<MatchingReview inventory={inventory} catalogue={catalogue} decisions={[]} />);
  fireEvent.click(screen.getByRole("button", { name: "Archivar Kassler" }));
  await waitFor(() => { expect(setProductArchived).toHaveBeenCalledWith({ productId: "i", archived: true }); });
  expect(await screen.findByText("Kassler: archivado.")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Kassler" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByText("deshacer archivo"));
  expect(await screen.findByRole("button", { name: "Kassler" })).toBeInTheDocument();
  expect(setProductArchived).toHaveBeenLastCalledWith({ productId: "i", archived: false });
});
it("handles reverse catalogue-to-inventory matching using the correct pair IDs", async () => {
  render(<MatchingReview inventory={inventory} catalogue={catalogue} decisions={[]} />);
  fireEvent.click(screen.getByText("catálogo → inventario"));
  fireEvent.click(screen.getByRole("button", { name: "Confirmar Kassler" }));
  await waitFor(() => { expect(reviewProductMatch).toHaveBeenCalledWith({ inventoryId: "i", catalogueId: "c", status: "accepted" }); });
});
it("searches manually beyond recommendations and hides archived catalogue candidates", () => {
  render(<MatchingReview inventory={inventory} catalogue={[...catalogue, { id: "d", name: "Arroz", unit: "kg", provider: "Mercado" }, { id: "e", name: "Arroz viejo", unit: "kg", provider: "Mercado", deletedAt: "2026-10-11" }]} decisions={[]} />);
  fireEvent.change(screen.getByRole("textbox", { name: "Buscar coincidencia" }), { target: { value: "Mercado" } });
  expect(screen.getByText("Arroz")).toBeInTheDocument();
  expect(screen.queryByText("Arroz viejo")).not.toBeInTheDocument();
});
