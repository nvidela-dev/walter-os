import { readFileSync } from "node:fs";

import { PGlite } from "@electric-sql/pglite";
import { expect, it } from "vitest";

import { runChange } from "@/lib/inventory/run-display";

it("consolidates the baseline and records next-run increases, decreases and unchanged counts", async () => {
  const db = new PGlite();
  try {
    await db.exec("CREATE TABLE productos(id uuid PRIMARY KEY,nombre text,unidad text); INSERT INTO productos VALUES ('00000000-0000-4000-8000-000000000001','Pasta','kg'),('00000000-0000-4000-8000-000000000002','Arroz','kg'),('00000000-0000-4000-8000-000000000003','Sal','kg')");
    for (const file of ['0012_inventory.sql','0013_soft_valkyrie.sql','0014_concerned_nemesis.sql','0015_bored_mandroid.sql']) await db.exec(readFileSync(`drizzle/${file}`, 'utf8'));
    await db.exec("INSERT INTO heladeras(id,numero,nombre) VALUES ('00000000-0000-4000-8000-000000000010',1,'Cocina'); INSERT INTO heladera_productos(heladera_id,producto_id) SELECT '00000000-0000-4000-8000-000000000010',id FROM productos");
    async function count(product: number, quantity: number, date: string): Promise<void> {
      await db.query("INSERT INTO observaciones_inventario(heladera_id,producto_id,cantidad,unidad,registrado_at,registrado_por) VALUES ('00000000-0000-4000-8000-000000000010',$1,$2,'kg',$3,'kitchen')", [`00000000-0000-4000-8000-00000000000${product}`,quantity,date]);
    }
    await count(1,10,'2026-10-06T14:00:00Z');
    await count(1,8,'2026-10-06T15:00:00Z');
    await count(2,4,'2026-10-06T16:00:00Z');
    await db.exec(readFileSync('drizzle/0016_zippy_leper_queen.sql','utf8'));
    expect((await db.query("SELECT * FROM inventarios")).rows).toHaveLength(1);
    expect((await db.query("SELECT cantidad,cambio FROM inventario_items ORDER BY producto_id")).rows).toEqual([{cantidad:'8.00',cambio:null},{cantidad:'4.00',cambio:null}]);
    await count(1,5,'2026-10-13T14:00:00Z');
    await count(2,4,'2026-10-13T15:00:00Z');
    await count(3,7,'2026-10-13T16:00:00Z');
    expect((await db.query("SELECT * FROM inventarios")).rows).toHaveLength(2);
    expect((await db.query("SELECT cantidad,cambio FROM inventario_items i JOIN inventarios r ON r.id=i.inventario_id WHERE r.fecha='2026-10-13' ORDER BY producto_id")).rows).toEqual([{cantidad:'5.00',cambio:'-3.00'},{cantidad:'4.00',cambio:'0.00'},{cantidad:'7.00',cambio:null}]);
    await count(1,12,'2026-10-13T17:00:00Z');
    expect((await db.query("SELECT cambio FROM inventario_items i JOIN inventarios r ON r.id=i.inventario_id WHERE r.fecha='2026-10-13' AND producto_nombre='Pasta'")).rows).toEqual([{cambio:'4.00'}]);
    expect((await db.query("SELECT cantidad FROM inventario_items i JOIN inventarios r ON r.id=i.inventario_id WHERE r.fecha='2026-10-06' AND producto_nombre='Pasta'")).rows).toEqual([{cantidad:'8.00'}]);
    expect((await db.query("SELECT * FROM observaciones_inventario")).rows).toHaveLength(7);
    // Midnight in UTC remains the same inventory day in Montevideo.
    await count(2,6,'2026-10-14T01:00:00Z');
    expect((await db.query("SELECT * FROM inventarios")).rows).toHaveLength(2);
    // Renaming later does not rewrite the recorded snapshot.
    await db.exec("UPDATE heladeras SET numero=9,nombre='Freezer'; UPDATE productos SET nombre='Renamed' WHERE nombre='Pasta'");
    expect((await db.query("SELECT DISTINCT heladera_numero FROM inventario_items")).rows).toEqual([{heladera_numero:1}]);
    await expect(db.exec("DELETE FROM observaciones_inventario")).rejects.toThrow();
  } finally { await db.close(); }
});

it("hides initial comparisons and formats later differences", () => {
  expect(runChange(null,true)).toBeNull();
  expect(runChange('0.00')).toBe('Sin cambios');
  expect(runChange('-3.00')).toBe('-3');
  expect(runChange('4.00')).toBe('+4');
  expect(runChange(null)).toBe('Sin cantidad comparable en el inventario anterior');
});
