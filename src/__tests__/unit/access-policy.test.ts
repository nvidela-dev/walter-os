import { describe, expect, it } from "vitest";

import { canAccess, landingPath, routeDecision } from "@/lib/auth/policy";

describe("Admin and Kitchen policy", () => {
  it("Admin sees everything, Kitchen sees inventory, and no group sees neither", () => {
    expect(canAccess("admin", "main")).toBe(true);
    expect(canAccess("admin", "inventory")).toBe(true);
    expect(canAccess("kitchen", "main")).toBe(false);
    expect(canAccess("kitchen", "inventory")).toBe(true);
    expect(canAccess(null, "main")).toBe(false);
    expect(canAccess(null, "inventory")).toBe(false);
    expect(landingPath("admin")).toBe("/");
    expect(landingPath("kitchen")).toBe("/inventory");
    expect(landingPath(null)).toBe("/not-authorized");
  });
  it("routes Kitchen away from all administrative pages, including direct links", () => {
    for (const path of ["/", "/providers", "/invoices", "/dashboard", "/access", "/inventory-other"]) {
      expect(routeDecision("kitchen", path, "GET")).toBe("inventory");
      expect(routeDecision("admin", path, "GET")).toBe("allow");
    }
    expect(routeDecision("kitchen", "/inventory", "GET")).toBe("allow");
    expect(routeDecision("kitchen", "/inventory/fridge-id", "GET")).toBe("allow");
  });
  it("sends users without groups to request access even when entering via the PWA", () => {
    for (const path of ["/", "/inventory", "/inventory/fridge-id", "/providers"]) {
      expect(routeDecision(null, path, "GET")).toBe("request-access");
    }
  });
  it("rejects forbidden mutations and API requests without redirecting them", () => {
    expect(routeDecision("kitchen", "/providers", "POST")).toBe("forbidden");
    expect(routeDecision("kitchen", "/access", "POST")).toBe("forbidden");
    expect(routeDecision("kitchen", "/api/users", "GET")).toBe("forbidden");
    expect(routeDecision(null, "/inventory", "POST")).toBe("forbidden");
    expect(routeDecision("kitchen", "/inventory/fridge-id", "POST")).toBe("allow");
  });
});
