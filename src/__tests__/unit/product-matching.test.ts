import { describe, expect, it } from "vitest";

import { suggestMatch } from "@/lib/product-matching";

const item = (name: string) => ({ id: "inventory", name, unit: "unidad" });
const catalogue = (name: string) => ({ id: "catalogue", name, unit: "kg", provider: "Supplier" });
describe("conceptual catalogue recommendations", () => {
  it("automatically recognizes names despite accents and whitespace, without converting units", () => {
    expect(suggestMatch(item(" Ananá "), catalogue("ANANA"))?.exact).toBe(true);
  });
  it("recognizes catalogue spelling errors as reviewable hypotheses", () => {
    expect(suggestMatch(item("Nuggets"), catalogue("Nuguet"))?.exact).toBe(false);
    expect(suggestMatch(item("Kassler"), catalogue("Kasler"))?.reason).toContain("escritura");
  });
  it("keeps cheddar alternatives and preparation differences uncertain", () => {
    for (const name of ["Queso Cheddar Lover - En Barra", "Queso Cheddar Untable 500G"]) expect(suggestMatch(item("Cheddar"), catalogue(name))?.exact).toBe(false);
    expect(suggestMatch(item("Pollo picado"), catalogue("Cubos de pollo asado"))?.exact).toBe(false);
  });
  it("leaves unknown items and incompatible variants without guesses", () => {
    expect(suggestMatch(item("Ñoquis papas"), catalogue("Sorrentinos"))).toBeNull();
    expect(suggestMatch(item("Mila pescado"), catalogue("Milanesas"))).toBeNull();
    expect(suggestMatch(item("Pan molde celíaco"), catalogue("Molde para Sándwiches"))).toBeNull();
  });
});
