import { expect, it } from "vitest";

import { type DuplicateProduct, suggestDuplicate } from "@/lib/product-duplicates";

const product: DuplicateProduct = { id: "a", name: "Ananá", unit: "unidad", deletedAt: null, createdAt: "2026-10-06T20:00:00Z", providers: [{ id: "s", name: "Supplier", price: null }], placements: [{ number: 1, active: true, note: null }], observations: 2, invoices: 0 };
it("ranks exact identities sharing supplier and fridge above spelling hypotheses", () => {
  const exact = suggestDuplicate(product, { ...product, id: "b", name: "Anana" });
  expect(exact?.score).toBe(100);
  expect(exact?.reason).toContain("Misma heladera");
  expect(suggestDuplicate({ ...product, name: "Kassler" }, { ...product, id: "b", name: "Kasler", unit: "kg" })?.score).toBeLessThan(100);
});
it("excludes the same ID, archived identities and generic invoice buckets", () => {
  expect(suggestDuplicate(product, product)).toBeNull();
  expect(suggestDuplicate(product, { ...product, id: "b", deletedAt: "2026-10-13" })).toBeNull();
  expect(suggestDuplicate({ ...product, name: "Varios" }, { ...product, id: "b", name: "Varios" })).toBeNull();
});
it("does not suggest different fillings or unrelated items as duplicates", () => {
  expect(suggestDuplicate({ ...product, name: "Sorrentinos calabaza" }, { ...product, id: "b", name: "Sorrentinos jyq" })).toBeNull();
  expect(suggestDuplicate(product, { ...product, id: "b", name: "Arroz" })).toBeNull();
  expect(suggestDuplicate({ ...product, name: "Coca-Cola 600" }, { ...product, id: "b", name: "Coca-Cola 500" })).toBeNull();
});
