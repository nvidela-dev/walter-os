
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), user: vi.fn(), main: vi.fn(), query: vi.fn(), waitress: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth, currentUser: mocks.user }));
vi.mock("@/lib/auth/allowlist", () => ({ isAllowedEmail: mocks.main, normalizeEmail: (email: string) => email.trim().toLowerCase() }));
vi.mock("@/db", async () => {
  const { waitressEmails } = await import("@/db/schema");
  return { db: { select: () => ({ from: (table: unknown) => ({ where: () => ({ limit: table === waitressEmails ? mocks.waitress : mocks.query }) }) }) } };
});

import { isInventoryEmail, requireAccess } from "@/lib/auth/access";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ userId: "user_inventory" });
  mocks.user.mockResolvedValue({ primaryEmailAddress: { emailAddress: "Inventory@example.com", verification: { status: "verified" } } });
  mocks.query.mockResolvedValue([{ id: "inventory_membership" }]);
  mocks.waitress.mockResolvedValue([]);
  mocks.main.mockResolvedValue(false);
});

describe("separate inventory access", () => {
  it("allows inventory membership but denies administrative access", async () => {
    await expect(requireAccess("inventory")).resolves.toBe("user_inventory");
    await expect(requireAccess("main")).rejects.toThrow();
  });
  it("lets Admin access both areas without a separate Kitchen membership", async () => {
    mocks.main.mockResolvedValue(true);
    mocks.query.mockResolvedValue([]);
    await expect(requireAccess("main")).resolves.toBe("user_inventory");
    await expect(requireAccess("inventory")).resolves.toBe("user_inventory");
  });
  it("rejects unauthenticated and unverified identities", async () => {
    mocks.auth.mockResolvedValueOnce({ userId: null });
    await expect(requireAccess("inventory")).rejects.toThrow();
    mocks.user.mockResolvedValue({ primaryEmailAddress: { emailAddress: "Inventory@example.com", verification: { status: "unverified" } } });
    await expect(requireAccess("inventory")).rejects.toThrow();
    expect(mocks.query).not.toHaveBeenCalled();
  });
  it("fails closed for missing membership, missing email, or database failure", async () => {
    expect(await isInventoryEmail(null)).toBe(false);
    mocks.query.mockResolvedValueOnce([]);
    await expect(requireAccess("inventory")).rejects.toThrow();
    mocks.query.mockRejectedValueOnce(new Error("database unavailable"));
    await expect(requireAccess("inventory")).rejects.toThrow();
  });
  it("all main Server Actions reject an inventory-only caller before handling input", async () => {
    const modules = await Promise.all([
      import("@/lib/actions/products"), import("@/lib/actions/providers"),
      import("@/lib/actions/employees"), import("@/lib/actions/invoices"),
      import("@/lib/actions/menu"), import("@/lib/actions/recipes"),
      import("@/app/dashboard/actions"), import("@/lib/actions/access"),
    ]);
    for (const actions of modules) {
      for (const action of Object.values(actions)) {
        await expect(Reflect.apply(action, undefined, [null, null, null, null])).rejects.toThrow();
      }
    }
  });
});
