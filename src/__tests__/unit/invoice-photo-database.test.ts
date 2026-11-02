import { randomUUID } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";

import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/access", () => ({ requireAccess: vi.fn().mockResolvedValue("admin") }));
vi.mock("@/db", async () => {
  const { drizzle } = await import("drizzle-orm/pglite");
  const client = new PGlite();
  const db = drizzle(client);
  return { db: Object.assign(db, { batch: async (queries: PromiseLike<unknown>[]) => {
    await client.exec("BEGIN");
    try {
      const results = [];
      for (const query of queries) results.push(await query);
      await client.exec("COMMIT");
      return results;
    } catch (error) { await client.exec("ROLLBACK"); throw error; }
  } }), testClient: client };
});

import { createInvoice } from "@/lib/actions/invoices";
import { claimScanQuota } from "@/lib/invoice-photo/quota";

let client: PGlite;
const providerId = randomUUID();
const productId = randomUUID();
const input = { providerId, date: "2026-10-18", number: "A-123", lines: [{ productId, quantity: "2", unitPrice: "12.50" }] };
beforeAll(async () => {
  const databaseModule = await import("@/db");
  const value: unknown = Reflect.get(databaseModule, "testClient");
  if (!(value instanceof PGlite)) throw new Error("Missing database");
  client = value;
  for (const file of readdirSync("drizzle").filter((name) => name.endsWith(".sql")).sort()) await client.exec(readFileSync(`drizzle/${file}`, "utf8"));
  await client.query("INSERT INTO proveedores(id,nombre,deuda) VALUES ($1,'Photo supplier',77)", [providerId]);
  await client.query("INSERT INTO productos(id,nombre,unidad_id) SELECT $1,'Photo rice',id FROM unidades WHERE codigo='unidad'", [productId]);
  await client.query("INSERT INTO proveedor_productos(proveedor_id,producto_id,precio) VALUES ($1,$2,10)", [providerId, productId]);
}, 30000);
afterAll(async () => { await client.close(); });

it("saves once across retries, preserves debt and appends one price history", async () => {
  const submission = { submissionId: randomUUID(), reviewedTotal: "25.00" };
  const first = await createInvoice(input, submission);
  expect(first.ok).toBe(true);
  expect(await createInvoice(input, submission)).toEqual(first);
  expect((await client.query("SELECT * FROM facturas")).rows).toHaveLength(1);
  expect((await client.query("SELECT * FROM factura_lineas")).rows).toHaveLength(1);
  expect((await client.query("SELECT * FROM historial_precios")).rows).toHaveLength(1);
  expect((await client.query("SELECT deuda FROM proveedores WHERE id=$1", [providerId])).rows).toEqual([{ deuda: "77.00" }]);
  expect((await client.query("SELECT precio FROM proveedor_productos WHERE proveedor_id=$1", [providerId])).rows).toEqual([{ precio: "12.50" }]);
});
it("flags likely duplicate numbers and rejects mismatched totals before saving", async () => {
  expect(await createInvoice({ ...input, number: " a-123 " }, { submissionId: randomUUID() })).toMatchObject({ ok: false, error: expect.stringContaining("Ya existe") });
  expect(await createInvoice({ ...input, number: "A-124" }, { submissionId: randomUUID(), reviewedTotal: "30.50" })).toMatchObject({ ok: false, error: expect.stringContaining("total") });
  expect((await client.query("SELECT * FROM facturas")).rows).toHaveLength(1);
});
it("enforces persistent user cooldown and per-day quotas, resets on the next day", async () => {
  expect(await claimScanQuota("admin")).toBe(true);
  expect(await claimScanQuota("admin")).toBe(false);
  await client.exec("UPDATE uso_lectura_facturas SET ultimo_at=now()-interval '1 minute',cantidad=30 WHERE clave='user:admin'");
  expect(await claimScanQuota("admin")).toBe(false);
  await client.exec("UPDATE uso_lectura_facturas SET dia=dia-1 WHERE clave='user:admin'");
  expect(await claimScanQuota("admin")).toBe(true);
  await client.exec("UPDATE uso_lectura_facturas SET cantidad=200 WHERE clave='global'");
  expect(await claimScanQuota("another-admin")).toBe(false);
});
