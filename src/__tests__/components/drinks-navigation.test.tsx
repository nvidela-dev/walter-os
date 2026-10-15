import { render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { DrinksNavigation } from "@/app/drinks/drinks-navigation";

vi.mock("next/navigation", () => ({ usePathname: () => "/drinks/history", useSearchParams: () => new URLSearchParams("category=Cervezas&week=2026-10-13") }));
it("uses exactly three category tabs and preserves category through staff navigation", () => {
  render(<DrinksNavigation />);
  const tabs = within(screen.getByRole("navigation", { name: "Categorías de bebidas" })).getAllByRole("link");
  expect(tabs).toHaveLength(3);
  expect(tabs.map((tab) => tab.textContent)).toEqual(["Alcoholes", "Cervezas", "Refrescos"]);
  expect(screen.getByRole("link", { name: "Cervezas" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: "Contar" })).toHaveAttribute("href", "/drinks?category=Cervezas");
  expect(screen.getByRole("link", { name: "Refrescos" })).toHaveAttribute("href", "/drinks/history?week=2026-10-13&category=Refrescos");
  expect(screen.queryByRole("link", { name: "Bebidas y objetivos" })).not.toBeInTheDocument();
});
