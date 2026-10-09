import { readdirSync, readFileSync } from "node:fs";

import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";

import { inventoryBootstrapSql } from "../../../scripts/inventory-bootstrap";

describe("Vercel inventory setup", () => {
  it("installs only inventory without granting access, and safely repeats", async () => {
    const db = new PGlite();
    try {
      await db.exec("CREATE TABLE productos (id uuid PRIMARY KEY, nombre text); INSERT INTO productos VALUES ('00000000-0000-4000-8000-000000000001', 'Existing product'); CREATE SCHEMA drizzle; CREATE TABLE drizzle.__drizzle_migrations (id integer, created_at bigint); INSERT INTO drizzle.__drizzle_migrations VALUES (5,1778295006907)");
      await db.exec("CREATE TABLE proveedor_productos(precio numeric NOT NULL CHECK(precio > 0))");
      const before = (await db.query("SELECT * FROM productos")).rows;
      const ledger = (await db.query("SELECT * FROM drizzle.__drizzle_migrations")).rows;
      await db.exec(inventoryBootstrapSql());
      await db.exec("INSERT INTO heladeras(numero) VALUES (3)");
      await db.exec("INSERT INTO heladera_productos(heladera_id, producto_id) SELECT id, '00000000-0000-4000-8000-000000000001' FROM heladeras");
      expect((await db.query("SELECT activo FROM heladera_productos")).rows).toEqual([{ activo: true }]);
      await db.exec("UPDATE heladera_productos SET activo=false");
      await db.exec(inventoryBootstrapSql());
      expect((await db.query("SELECT activo FROM heladera_productos")).rows).toEqual([{ activo: false }]);
      expect((await db.query("SELECT email FROM usuarios_inventario")).rows).toEqual([]);
      expect((await db.query("SELECT email FROM usuarios_bebidas")).rows).toEqual([]);
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

it("preserves target revisions and active pointers across setup, and refuses a missing immutable trigger", async () => {
  const db = new PGlite();
  try {
    await db.exec("CREATE TABLE productos(id uuid PRIMARY KEY,nombre text); INSERT INTO productos VALUES ('00000000-0000-4000-8000-000000000001','Arroz')");
    await db.exec("CREATE TABLE proveedor_productos(precio numeric NOT NULL CHECK(precio > 0))");
    await db.exec(inventoryBootstrapSql());
    await db.exec("INSERT INTO historial_objetivos_inventario(producto_id,cantidad,unidad,registrado_por) VALUES ('00000000-0000-4000-8000-000000000001',12,'kg','admin')");
    const history = (await db.query("SELECT * FROM historial_objetivos_inventario")).rows;
    const pointer = (await db.query("SELECT * FROM objetivos_inventario_activos")).rows;
    await db.exec(inventoryBootstrapSql());
    expect((await db.query("SELECT * FROM historial_objetivos_inventario")).rows).toEqual(history);
    expect((await db.query("SELECT * FROM objetivos_inventario_activos")).rows).toEqual(pointer);
    await db.exec("DROP TRIGGER objetivos_inmutables ON historial_objetivos_inventario");
    await expect(db.exec(inventoryBootstrapSql())).rejects.toThrow("Inventory target triggers are missing or disabled");
  } finally { await db.close(); }
});

it("upgrades existing provider links for price-free matching without changing known prices, and safely repeats", async () => {
  const db = new PGlite();
  try {
    for (const file of readdirSync("drizzle").filter((name) => name.endsWith(".sql") && name < "0019").sort()) {
      await db.exec(readFileSync(`drizzle/${file}`, "utf8"));
    }
    await db.exec("INSERT INTO proveedores(id,nombre) VALUES ('00000000-0000-4000-8000-000000000001','Supplier'); INSERT INTO productos(id,nombre) VALUES ('00000000-0000-4000-8000-000000000002','Cheddar'),('00000000-0000-4000-8000-000000000003','Rice'); INSERT INTO proveedor_productos(proveedor_id,producto_id,precio) VALUES ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000003',25)");
    await db.exec(inventoryBootstrapSql());
    await db.exec("INSERT INTO proveedor_productos(proveedor_id,producto_id,precio) VALUES ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002',NULL)");
    const links = (await db.query("SELECT * FROM proveedor_productos ORDER BY producto_id")).rows;
    await db.exec(inventoryBootstrapSql());
    expect((await db.query("SELECT * FROM proveedor_productos ORDER BY producto_id")).rows).toEqual(links);
    expect((await db.query("SELECT precio FROM proveedor_productos WHERE producto_id='00000000-0000-4000-8000-000000000002'")).rows).toEqual([{ precio: null }]);
    expect((await db.query("SELECT precio FROM proveedor_productos WHERE producto_id='00000000-0000-4000-8000-000000000003'")).rows).toEqual([{ precio: "25.00" }]);
    await expect(db.exec("UPDATE proveedor_productos SET precio=0")).rejects.toThrow();
  } finally { await db.close(); }
});

it("refuses partial drinks installations and disabled drink audit triggers", async () => {
  const db = new PGlite();
  try {
    await db.exec("CREATE TABLE productos(id uuid PRIMARY KEY,nombre text); CREATE TABLE proveedor_productos(precio numeric); CREATE TABLE usuarios_bebidas(email text)");
    await expect(db.exec(inventoryBootstrapSql())).rejects.toThrow("Partial drinks schema");
    await db.exec("DROP TABLE usuarios_bebidas");
    await db.exec(inventoryBootstrapSql());
    await db.exec("DROP TRIGGER bebidas_observaciones_inmutables ON observaciones_bebidas");
    await expect(db.exec(inventoryBootstrapSql())).rejects.toThrow("Drinks inventory triggers are missing or disabled");
  } finally { await db.close(); }
});
