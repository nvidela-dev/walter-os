import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";

import { inventoryBootstrapSql } from "../../../scripts/inventory-bootstrap";

describe("Vercel inventory setup", () => {
  it("installs only inventory without granting access, and safely repeats", async () => {
    const db = new PGlite();
    try {
      await db.exec("CREATE TABLE productos (id uuid PRIMARY KEY, nombre text); INSERT INTO productos VALUES ('00000000-0000-4000-8000-000000000001', 'Existing product'); CREATE SCHEMA drizzle; CREATE TABLE drizzle.__drizzle_migrations (id integer, created_at bigint); INSERT INTO drizzle.__drizzle_migrations VALUES (5,1778295006907)");
      const before = (await db.query("SELECT * FROM productos")).rows;
      const ledger = (await db.query("SELECT * FROM drizzle.__drizzle_migrations")).rows;
      await db.exec(inventoryBootstrapSql());
      await db.exec("INSERT INTO heladeras(numero) VALUES (3)");
      await db.exec(inventoryBootstrapSql());
      expect((await db.query("SELECT email FROM usuarios_inventario")).rows).toEqual([]);
      expect((await db.query("SELECT numero FROM heladeras")).rows).toEqual([{ numero: 3 }]);
      expect((await db.query("SELECT * FROM productos")).rows).toEqual(before);
      expect((await db.query("SELECT * FROM drizzle.__drizzle_migrations")).rows).toEqual(ledger);
    } finally { await db.close(); }
  });
  it("fails closed on a partial schema without changing existing tables", async () => {
    const db = new PGlite();
    try {
      await db.exec("CREATE TABLE usuarios_inventario (email text)");
      await expect(db.exec(inventoryBootstrapSql())).rejects.toThrow("Partial inventory schema");
      expect((await db.query("SELECT * FROM usuarios_inventario")).rows).toEqual([]);
      expect((await db.query("SELECT to_regclass('public.heladeras') as relation")).rows).toEqual([{ relation: null }]);
    } finally { await db.close(); }
  });
});
