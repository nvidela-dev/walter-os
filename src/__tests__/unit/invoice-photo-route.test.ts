import { beforeEach, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/access", () => ({ requireAccess: vi.fn() }));
vi.mock("@/lib/invoice-photo/quota", () => ({ claimScanQuota: vi.fn() }));
vi.mock("@/lib/invoice-photo/extract", () => ({ readPhoto: vi.fn(), extractInvoice: vi.fn() }));

import { POST } from "@/app/api/invoices/extract/route";
import { requireAccess } from "@/lib/auth/access";
import { extractInvoice, readPhoto } from "@/lib/invoice-photo/extract";
import { claimScanQuota } from "@/lib/invoice-photo/quota";

const request = (origin = "https://walter.test"): Request => new Request("https://walter.test/api/invoices/extract", { method: "POST", headers: { origin } });
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("OPENAI_API_KEY", "test");
  vi.mocked(requireAccess).mockResolvedValue("admin");
  vi.mocked(readPhoto).mockResolvedValue(new Uint8Array());
  vi.mocked(claimScanQuota).mockResolvedValue(true);
});
it("denies unauthorized users before reading an image or calling OpenAI", async () => {
  vi.mocked(requireAccess).mockRejectedValue(new Error("denied"));
  expect((await POST(request())).status).toBe(403);
  expect(readPhoto).not.toHaveBeenCalled();
  expect(extractInvoice).not.toHaveBeenCalled();
});
it("rejects cross-origin requests", async () => {
  expect((await POST(request("https://attacker.test"))).status).toBe(403);
  expect(extractInvoice).not.toHaveBeenCalled();
});
it("fails closed when unconfigured, invalid or over quota", async () => {
  vi.stubEnv("OPENAI_API_KEY", "");
  expect((await POST(request())).status).toBe(503);
  vi.stubEnv("OPENAI_API_KEY", "test");
  vi.mocked(readPhoto).mockRejectedValueOnce(new Error("bad"));
  expect((await POST(request())).status).toBe(400);
  vi.mocked(claimScanQuota).mockResolvedValue(false);
  expect((await POST(request())).status).toBe(429);
  expect(extractInvoice).not.toHaveBeenCalled();
});
it("does not leak API error contents and never caches invoice responses", async () => {
  vi.mocked(extractInvoice).mockRejectedValue(new Error("sensitive provider response"));
  const result = await POST(request());
  expect(result.status).toBe(502);
  expect(result.headers.get("cache-control")).toBe("no-store");
  expect(await result.text()).not.toContain("sensitive");
});
