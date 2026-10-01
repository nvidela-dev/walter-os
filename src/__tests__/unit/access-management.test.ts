import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const actor = vi.hoisted(() => ({ email: "admin@example.com" }));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(() => Promise.resolve({ userId: "actor" })),
  currentUser: vi.fn(() => Promise.resolve({ primaryEmailAddress: { emailAddress: actor.email, verification: { status: "verified" } } })),
}));
vi.mock("@/db", async () => {
  const { drizzle } = await import("drizzle-orm/pglite");
  const client = new PGlite();
  const db = drizzle(client);
  return { db: Object.assign(db, { batch: async (queries: PromiseLike<unknown>[]) => {
    await client.exec("BEGIN");
    try {
      for (const query of queries) await query;
      await client.exec("COMMIT");
    } catch (error) { await client.exec("ROLLBACK"); throw error; }
  } }), testClient: client };
});

import { setAccessGroup } from "@/lib/actions/access";
import { getAccessGroup, requireAccess } from "@/lib/auth/access";
import { getAccessMembers } from "@/lib/queries/access";

let client: PGlite;
beforeAll(async () => {
  const databaseModule = await import("@/db");
  const value: unknown = Reflect.get(databaseModule, "testClient");
  if (!(value instanceof PGlite)) throw new Error("Missing test database");
  client = value;
  await client.exec(`
    CREATE TABLE usuarios_autorizados (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text UNIQUE NOT NULL, created_at timestamp DEFAULT now());
    CREATE TABLE usuarios_inventario (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text UNIQUE NOT NULL, created_at timestamptz DEFAULT now());
    INSERT INTO usuarios_autorizados(email) VALUES ('admin@example.com');
  `);
});
beforeEach(() => { actor.email = "admin@example.com"; });
afterAll(async () => { await client.close(); });

describe("group management against PostgreSQL", () => {
  it("a new authenticated account has no access until assigned", async () => {
    actor.email = "new@example.com";
    expect(await getAccessGroup(actor.email)).toBeNull();
    await expect(requireAccess("main")).rejects.toThrow();
    await expect(requireAccess("inventory")).rejects.toThrow();
  });
  it("Admin can assign Kitchen, promote to Admin, demote, and revoke completely", async () => {
    expect((await setAccessGroup({ email: " Worker@Example.com ", group: "kitchen" })).ok).toBe(true);
    expect(await getAccessGroup("worker@example.com")).toBe("kitchen");
    expect((await setAccessGroup({ email: "worker@example.com", group: "admin" })).ok).toBe(true);
    expect(await getAccessGroup("worker@example.com")).toBe("admin");
    expect((await client.query("SELECT * FROM usuarios_inventario WHERE email='worker@example.com'")).rows).toHaveLength(0);
    expect((await setAccessGroup({ email: "worker@example.com", group: "kitchen" })).ok).toBe(true);
    expect(await getAccessGroup("worker@example.com")).toBe("kitchen");
    expect((await setAccessGroup({ email: "worker@example.com", group: "none" })).ok).toBe(true);
    expect(await getAccessGroup("worker@example.com")).toBeNull();
  });
  it("Kitchen cannot list users, self-promote, or assign someone else", async () => {
    await setAccessGroup({ email: "chef@example.com", group: "kitchen" });
    actor.email = "chef@example.com";
    await expect(requireAccess("inventory")).resolves.toBe("actor");
    await expect(getAccessMembers()).rejects.toThrow();
    await expect(setAccessGroup({ email: actor.email, group: "admin" })).rejects.toThrow();
    await expect(setAccessGroup({ email: "outsider@example.com", group: "kitchen" })).rejects.toThrow();
    expect(await getAccessGroup(actor.email)).toBe("kitchen");
    expect(await getAccessGroup("outsider@example.com")).toBeNull();
  });
  it("prevents self-demotion and self-revocation", async () => {
    expect((await setAccessGroup({ email: actor.email, group: "kitchen" })).ok).toBe(false);
    expect((await setAccessGroup({ email: actor.email, group: "none" })).ok).toBe(false);
    expect(await getAccessGroup(actor.email)).toBe("admin");
  });
  it("Admin wins for legacy dual membership, with one listing", async () => {
    await client.exec("INSERT INTO usuarios_inventario(email) VALUES ('admin@example.com')");
    expect(await getAccessGroup(actor.email)).toBe("admin");
    await expect(requireAccess("inventory")).resolves.toBe("actor");
    const members = await getAccessMembers();
    expect(members.filter((member) => member.email === actor.email)).toEqual([{ email: actor.email, group: "admin" }]);
  });
  it("invalid groups cannot create membership", async () => {
    expect((await setAccessGroup({ email: "oops@example.com", group: "superuser" })).ok).toBe(false);
    expect(await getAccessGroup("oops@example.com")).toBeNull();
  });
});
