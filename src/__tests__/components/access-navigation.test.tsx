import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import InventoryLayout from "@/app/inventory/layout";
import NotAuthorizedPage from "@/app/not-authorized/page";
import Home from "@/app/page";
import { t } from "@/i18n";
import { getCurrentGroup } from "@/lib/auth/access";

vi.mock("@/lib/auth/access", () => ({ getCurrentGroup: vi.fn() }));
vi.mock("@clerk/nextjs", () => ({ UserButton: () => null, useClerk: () => ({ signOut: vi.fn() }) }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));

describe("group-specific navigation", () => {
  it("Admin sees the inventory tile and access management", async () => {
    vi.mocked(getCurrentGroup).mockResolvedValue("admin");
    render(await Home());
    expect(screen.getByRole("link", { name: /^Inventario/ })).toHaveAttribute("href", "/inventory");
    expect(screen.getByRole("link", { name: t.access.title })).toHaveAttribute("href", "/access");
    expect(screen.getByRole("link", { name: /Proveedores/ })).toHaveAttribute("href", "/providers");
  });
  it("Kitchen is redirected before the admin home renders", async () => {
    vi.mocked(getCurrentGroup).mockResolvedValue("kitchen");
    await expect(Home()).rejects.toThrow("redirect:/inventory");
    render(await InventoryLayout({ children: <p>Inventory content</p> }));
    expect(screen.queryByRole("link", { name: t.access.mainApp })).not.toBeInTheDocument();
  });
  it("Admin can return from inventory to the main app", async () => {
    vi.mocked(getCurrentGroup).mockResolvedValue("admin");
    render(await InventoryLayout({ children: <p>Inventory content</p> }));
    expect(screen.getByRole("link", { name: t.access.mainApp })).toHaveAttribute("href", "/");
  });
  it("no group receives Spanish request-access guidance and can retry after assignment", async () => {
    vi.mocked(getCurrentGroup).mockResolvedValue(null);
    await expect(Home()).rejects.toThrow("redirect:/not-authorized");
    render(await NotAuthorizedPage());
    expect(screen.getByRole("heading", { name: "Solicitá acceso" })).toBeInTheDocument();
    expect(screen.getByText(t.auth.deniedBody)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: t.access.checkAgain })).toHaveAttribute("href", "/");
  });
  it("an assigned user leaves the request-access screen for their group landing page", async () => {
    vi.mocked(getCurrentGroup).mockResolvedValue("kitchen");
    await expect(NotAuthorizedPage()).rejects.toThrow("redirect:/inventory");
    vi.mocked(getCurrentGroup).mockResolvedValue("admin");
    await expect(NotAuthorizedPage()).rejects.toThrow("redirect:/");
  });
});
