import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

import { DuplicateReview } from "@/app/product-duplicates/duplicate-review";
import { archiveDuplicate } from "@/lib/actions/product-duplicates";
import { setProductArchived } from "@/lib/actions/product-matching";
import type { DuplicateProduct } from "@/lib/product-duplicates";

vi.mock("@/lib/actions/product-duplicates", () => ({ archiveDuplicate: vi.fn() }));
vi.mock("@/lib/actions/product-matching", () => ({ setProductArchived: vi.fn() }));
const first: DuplicateProduct = { id: "first", name: "Supremas", unit: "unidad", deletedAt: null, createdAt: "2026-10-06T20:00:00Z", providers: [{ id: "p", name: "Carnicería", price: null }], placements: [{ number: 9, active: true, note: "13 medias" }], observations: 2, invoices: 0 };
const second = { ...first, id: "second", name: "Suprema", observations: 1 };
beforeEach(() => { vi.clearAllMocks(); vi.mocked(archiveDuplicate).mockResolvedValue({ ok: true, data: undefined }); vi.mocked(setProductArchived).mockResolvedValue({ ok: true, data: undefined }); });
it("reviews the exact keep/archive direction, confirms, hides and undoes", async () => {
  render(<DuplicateReview products={[first, second]} decisions={[]} />);
  fireEvent.click(screen.getByRole("button", { name: "Conservar segundo y archivar primero" }));
  expect(archiveDuplicate).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Confirmar archivo" }));
  await waitFor(() => { expect(archiveDuplicate).toHaveBeenCalledWith({ keepId: "second", archiveId: "first" }); });
  expect(await screen.findByRole("status")).toHaveTextContent("Se conservó Suprema");
  fireEvent.click(screen.getByRole("button", { name: "archivados" }));
  expect(screen.getByRole("button", { name: "Restaurar Supremas" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "deshacer archivo" }));
  await waitFor(() => { expect(setProductArchived).toHaveBeenCalledWith({ productId: "first", archived: false }); });
});
it("keeps a failed archive review intact", async () => {
  vi.mocked(archiveDuplicate).mockResolvedValue({ ok: false, error: "Producto cambió" });
  render(<DuplicateReview products={[first, second]} decisions={[]} />);
  fireEvent.click(screen.getByRole("button", { name: "Conservar primero y archivar segundo" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirmar archivo" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Producto cambió");
  expect(screen.getByRole("region", { name: "Confirmar archivo" })).toBeInTheDocument();
});
it("honors rejected pairs in suggestions and warns when selected manually", () => {
  render(<DuplicateReview products={[first, second]} decisions={[{ inventoryId: "first", catalogueId: "second", status: "rejected" }]} />);
  expect(screen.getByText("No hay productos en esta vista.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "todos" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Buscar segundo producto" }), { target: { value: "Suprema" } });
  expect(screen.getByText(/Este par fue descartado anteriormente/)).toBeInTheDocument();
});
it("restores preexisting archived identities after reload", async () => {
  render(<DuplicateReview products={[first, { ...second, deletedAt: "2026-10-13" }]} decisions={[]} />);
  fireEvent.click(screen.getByRole("button", { name: "archivados" }));
  fireEvent.click(screen.getByRole("button", { name: "Restaurar Suprema" }));
  await waitFor(() => { expect(setProductArchived).toHaveBeenCalledWith({ productId: "second", archived: false }); });
});
