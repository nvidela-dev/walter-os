import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

import DashboardLayout from "@/app/dashboard/layout";
import DashboardMenu from "@/app/dashboard/page";
import ProvidersDashboard from "@/app/dashboard/providers/page";
import { getProviderTree } from "@/app/dashboard/queries";
import Home from "@/app/page";
import { requireAccess } from "@/lib/auth/access";

vi.mock("@/lib/auth/access", () => ({ requireAccess: vi.fn(), getCurrentGroup: vi.fn(() => Promise.resolve("admin")) }));
vi.mock("@clerk/nextjs", () => ({ UserButton: () => null }));
vi.mock("@/app/dashboard/queries", () => ({ getProviderTree: vi.fn(() => Promise.resolve([])) }));
vi.mock("@/lib/queries/units", () => ({ getUnits: vi.fn(() => Promise.resolve([])) }));
vi.mock("@/app/dashboard/provider-tree", () => ({ ProviderTree: () => <p>Existing provider dashboard</p> }));
beforeEach(() => { vi.clearAllMocks(); vi.mocked(requireAccess).mockResolvedValue("admin"); });

it("renders exactly the three maintenance apps with the existing glass launcher styling", async () => {
  const { container } = render(await DashboardMenu());
  expect(container.querySelector(".home-screen")).toBeInTheDocument();
  expect(container.querySelectorAll(".ios-icon")).toHaveLength(3);
  expect(screen.getByRole("link", { name: /^Dashboard/ })).toHaveAttribute("href", "/dashboard/providers");
  expect(screen.getByRole("link", { name: /^Unir nombres/ })).toHaveAttribute("href", "/product-matching");
  expect(screen.getByRole("link", { name: /^Revisar duplicados/ })).toHaveAttribute("href", "/product-duplicates");
  expect(requireAccess).toHaveBeenCalledWith("main");
});

it("removes maintenance shortcuts from regular Home without adding a menu shortcut", async () => {
  render(await Home());
  expect(screen.queryByRole("link", { name: /^Unir nombres/ })).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /^Revisar duplicados/ })).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /^Dashboard/ })).not.toBeInTheDocument();
});

it("preserves the existing dashboard at its nested route and denies unauthorized renders before data reads", async () => {
  render(await ProvidersDashboard());
  expect(screen.getByText("Existing provider dashboard")).toBeInTheDocument();
  expect(getProviderTree).toHaveBeenCalledOnce();
  vi.mocked(getProviderTree).mockClear();
  vi.mocked(requireAccess).mockRejectedValue(new Error("Denied"));
  await expect(DashboardMenu()).rejects.toThrow("Denied");
  await expect(DashboardLayout({ children: <p>Secret</p> })).rejects.toThrow("Denied");
  await expect(ProvidersDashboard()).rejects.toThrow("Denied");
  expect(getProviderTree).not.toHaveBeenCalled();
});
