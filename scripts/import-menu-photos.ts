import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { z } from "zod";

import { menuItemInputSchema } from "../src/lib/validators/menu";

config({ path: ".env.local", quiet: true });
const rawSchema = menuItemInputSchema.extend({ menuName: z.string().min(1), section: z.string().min(1), sourceNote: z.string().min(1) });
const rows = z.array(rawSchema).parse(JSON.parse(readFileSync("scripts/data/menu-photos-2026-10-14.json", "utf8")));
const beers = z.array(z.object({ name: z.string(), existingId: z.uuid().nullable(), countUnit: z.enum(["botella"]).nullable() })).parse(JSON.parse(readFileSync("scripts/data/menu-beers-2026-10-14.json", "utf8")));
function stableId(key: string): string {
  const hex = createHash("sha256").update(`walter-menu-photo:${  key}`).digest("hex");
  return `${hex.slice(0, 8)  }-${  hex.slice(8, 12)  }-4${  hex.slice(13, 16)  }-8${  hex.slice(17, 20)  }-${  hex.slice(20, 32)}`;
}
async function main(): Promise<void> {
  const connection = process.env.DATABASE_URL;
  if (connection === undefined || connection === "") throw new Error("DATABASE_URL required");
  const sql = neon(connection);
  const catalogue = await sql.query("SELECT id,nombre,unidad,unidad_id FROM productos WHERE eliminado_at IS NULL");
  const plannedBeers = beers.map((beer) => {
    const candidates = beer.existingId === null ? catalogue.filter((p) => String(p.nombre).trim().toLowerCase() === beer.name.toLowerCase()) : catalogue.filter((p) => p.id === beer.existingId);
    if (candidates.length > 1 || (beer.existingId !== null && candidates.length !== 1)) throw new Error(`Ambiguous beer identity: ${  beer.name}`);
    return { ...beer, productId: candidates[0]?.id === undefined ? null : String(candidates[0].id) };
  });
  console.log(JSON.stringify({ mode: process.argv.includes("--apply") ? "apply" : "preview", menuItems: rows.length, sections: new Set(rows.map((row) => `${row.menuName  }/${  row.section}`)).size, byMenu: Object.fromEntries(["Don Juan","Genüsse"].map((name) => [name, rows.filter((row) => row.menuName === name).length])), review: rows.filter((row) => row.reviewNote !== null).map((row) => ({ menu: row.menuName, name: row.name, note: row.reviewNote })), beers: plannedBeers.map((beer) => ({ name: beer.name, reuse: beer.productId, countUnit: beer.countUnit ?? "unidad" })), draftBeerStatus: "Pending counting unit; no draft products or counts created" }, null, 2));
  if (!process.argv.includes("--apply")) return;
  const schema = await sql.query("SELECT column_name FROM information_schema.columns WHERE table_name='menu' AND column_name='clave_fuente'");
  if (schema.length !== 1) throw new Error("Deploy menu migration before applying import");
  const existingMenu = await sql.query("SELECT * FROM menu");
  const existingSections = await sql.query("SELECT * FROM menu_secciones");
  const drinkRows = await sql.query("SELECT * FROM inventario_bebidas_productos");
  const fingerprints = await sql.query("SELECT (SELECT count(*) FROM observaciones_bebidas)::int observations,(SELECT md5(coalesce(string_agg(proveedor_id::text||producto_id::text||coalesce(precio::text,'NULL')||cantidad::text,',' ORDER BY proveedor_id,producto_id),'')) FROM proveedor_productos) provider_prices");
  const backupDirectory = process.env.MENU_BACKUP_DIR ?? "backups/database";
  mkdirSync(backupDirectory, { recursive: true, mode: 0o700 });
  writeFileSync(join(backupDirectory, `menu-before-${  Date.now()  }.json`), JSON.stringify({ menu: existingMenu, sections: existingSections, drinks: drinkRows, fingerprints }), { mode: 0o600 });
  const [unit] = await sql.query("SELECT id FROM unidades WHERE codigo='unidad'");
  if (unit === undefined) throw new Error("Missing unit");
  const queries = [sql.query("SELECT pg_advisory_xact_lock(1790806175)")];
  const sections = [...new Set(rows.map((row) => `${row.menuName  }/${  row.section}`))];
  for (const key of sections) {
    const row = rows.find((r) => `${r.menuName  }/${  r.section}` === key);
    if (row === undefined) throw new Error("Missing section");
    queries.push(sql.query("INSERT INTO menu_secciones(id,carta,nombre,orden) VALUES ($1,$2,$3,$4) ON CONFLICT(id) DO NOTHING", [stableId(`section:${  key}`), row.menuName, row.section, sections.indexOf(key)]));
  }
  for (const row of rows) {
    const key = `photos-2026-10-14:${  row.menuName  }/${  row.section  }/${  row.name}`;
    queries.push(sql.query("INSERT INTO menu(id,nombre,descripcion,precio_venta,receta_id,seccion_id,opciones_precio,clave_fuente,fuente,nota_revision,orden) VALUES ($1,$2,$3,$4,NULL,$5,$6::jsonb,$7,$8,$9,$10) ON CONFLICT(clave_fuente) DO NOTHING", [stableId(key), row.name, row.description, row.sellPrice, stableId(`section:${  row.menuName  }/${  row.section}`), JSON.stringify(row.priceOptions), key, row.sourceNote, row.reviewNote, row.sortOrder]));
  }
  for (const beer of plannedBeers) {
    const productId = beer.productId ?? stableId(`beer:${  beer.name}`);
    if (beer.productId === null) queries.push(sql.query("INSERT INTO productos(id,nombre,unidad,unidad_id) VALUES ($1,$2,'unidad',$3) ON CONFLICT(id) DO NOTHING", [productId, beer.name, unit.id]));
    queries.push(sql.query("INSERT INTO inventario_bebidas_productos(producto_id,ubicacion,categoria,unidad_conteo) VALUES ($1,'Bar','Cervezas',$2) ON CONFLICT(producto_id,ubicacion) DO NOTHING", [productId, beer.countUnit]));
  }
  await sql.transaction(queries);
  const after = await sql.query("SELECT (SELECT count(*) FROM observaciones_bebidas)::int observations,(SELECT md5(coalesce(string_agg(proveedor_id::text||producto_id::text||coalesce(precio::text,'NULL')||cantidad::text,',' ORDER BY proveedor_id,producto_id),'')) FROM proveedor_productos) provider_prices");
  if (JSON.stringify(after) !== JSON.stringify(fingerprints)) throw new Error("Observation/provider fingerprint changed; inspect concurrent activity");
  console.log("Verified:", JSON.stringify(await sql.query("SELECT s.carta,count(*)::int items FROM menu m JOIN menu_secciones s ON s.id=m.seccion_id WHERE m.clave_fuente LIKE 'photos-2026-10-14:%' GROUP BY s.carta")));
  console.log("Drinks:", JSON.stringify(await sql.query("SELECT categoria,count(*)::int items FROM inventario_bebidas_productos WHERE activo GROUP BY categoria")));
}
void main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
