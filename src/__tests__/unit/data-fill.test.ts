import { randomUUID } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";

import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/access", () => ({ requireAccess: vi.fn(() => Promise.resolve("admin")) }));
vi.mock("@/db", async () => {
  const { drizzle } = await import("drizzle-orm/pglite");
  const client = new PGlite();
  return { db: drizzle(client), testClient: client };
});

import { assignProductProvider } from "@/lib/actions/data-fill";
import { requireAccess } from "@/lib/auth/access";
import { getDataFillQueue } from "@/lib/queries/data-fill";

let client: PGlite;
const productId = randomUUID();
const providerId = randomUUID();
const serviceId = randomUUID();

beforeAll(async () => {
  const databaseModule = await import("@/db");
  const value: unknown = Reflect.get(databaseModule, "testClient");
  if (!(value instanceof PGlite)) throw new Error("Missing test database");
  client = value;
  for (const file of readdirSync("drizzle").filter((name) => name.endsWith(".sql")).sort()) {
    await client.exec(`BEGIN;${readFileSync(`drizzle/${file}`, "utf8")};COMMIT;`);
  }
  await client.query("INSERT INTO productos(id,nombre) VALUES ($1,'Arroz')", [productId]);
  await client.query("INSERT INTO proveedores(id,nombre,tipo) VALUES ($1,'Alimentos','producto'),($2,'Electricidad','servicio')", [providerId, serviceId]);
}, 30000);
afterAll(async () => { await client.close(); });

it("filters suppliers, persists a price-free link, removes it from the queue and preserves prices on retry", async () => {
  const queue = await getDataFillQueue();
  expect(queue.pending.map((row) => row.id)).toContain(productId);
  expect(queue.suppliers.map((row) => row.id)).toEqual([providerId]);
  expect((await assignProductProvider({ productId, providerId: serviceId })).ok).toBe(false);
  expect((await assignProductProvider({ productId, providerId })).ok).toBe(true);
  const rows = await client.query("SELECT precio FROM proveedor_productos WHERE producto_id=$1", [productId]);
  expect(rows.rows).toEqual([{ precio: null }]);
  expect((await getDataFillQueue()).pending).toHaveLength(0);
  expect((await client.query("SELECT * FROM historial_precios")).rows).toHaveLength(0);
  await client.query("UPDATE proveedor_productos SET precio=25 WHERE producto_id=$1", [productId]);
  expect((await assignProductProvider({ productId, providerId })).ok).toBe(false);
  expect((await client.query("SELECT precio FROM proveedor_productos WHERE producto_id=$1", [productId])).rows).toEqual([{ precio: "25.00" }]);
});

it("rejects unauthorized saves and reads", async () => {
  vi.mocked(requireAccess).mockRejectedValueOnce(new Error("Denied"));
  await expect(assignProductProvider({ productId, providerId })).rejects.toThrow("Denied");
  vi.mocked(requireAccess).mockRejectedValueOnce(new Error("Denied"));
  await expect(getDataFillQueue()).rejects.toThrow("Denied");
});
