import { mkdirSync, writeFileSync } from "node:fs";

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
async function main(): Promise<void> {
const connection = process.env.DATABASE_URL;
if (connection === undefined || connection === "") throw new Error("DATABASE_URL is required");
const sql = neon(connection);
const belater = "5b814894-14ec-4cbc-a3e5-dca9ba85d8a9";
const alcohols = ["Fernet Branca", "Jägermeister", "Jägermeister Orange", "Gin Brighton London Dry", "Jack Daniel's Apple", "Gancia Americano", "Cazanove", "Granadina", "Tres Plumas Blue Curaçao", "Tres Plumas Triple Sec", "Martini Bianco", "Martini Rosso", "Aperol", "William Lawson's", "Jack Daniel's Honey", "Johnnie Walker Red Label", "Johnnie Walker Black Label", "Vodka History (marca por confirmar)"];
// Explicitly reviewed catalogue identities; generic IVA/Varios are not drinks.
const softDrinkIds = ["ad72b18e-f56f-4163-940c-8862cdd5a46d", "cbdefd8d-4ae5-48f3-8a1a-368838ac85f7", "79f90492-650e-48b9-be3e-653a62704134", "5e4ddb7a-1df1-43e0-b2c6-3a0de850148a", "284d1917-ac77-4f6b-b787-ae3ab05cb1f3", "f587a3f0-491f-4994-92e0-25b7afe06637", "79109672-1e08-4897-baa4-09933378f8cd", "ff6aa31b-f745-48d0-94ee-d68de799dadc", "a3e546bd-9c15-44e9-85d3-3146b02101ce", "c731edcf-7000-4323-8a10-ea203cfd935f", "90147ae9-70c8-445e-8ecf-9c79c8a49502", "a4f82736-b0b3-4355-b70f-4fc6512fa658", "daffe8ca-cb5b-4fa1-ae68-124074b4f03d"];
const normalize = (value: string): string => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
const catalogue = await sql`select p.id,p.nombre,p.unidad,pp.proveedor_id from productos p left join proveedor_productos pp on pp.producto_id=p.id where p.eliminado_at is null`;
const provider = await sql`select id from proveedores where id=${belater} and tipo='producto'`;
if (provider.length !== 1) throw new Error("Belater provider not found");
const [unit] = await sql`select id from unidades where codigo='unidad'`;
if (!unit) throw new Error("Missing individual unit");
const plan = alcohols.map(name => {
  const matches = catalogue.filter(p => normalize(String(p.nombre)) === normalize(name));
  // Fernet has two catalogue presentations. Reuse the explicitly bottle-compatible unit identity.
  const candidates = [...new Map(matches.filter(p => p.unidad === "unidad").map(p => [p.id, p])).values()];
  if (candidates.length > 1 || (matches.length > 0 && candidates.length !== 1)) throw new Error(`Ambiguous catalogue match: ${name}`);
  const existing = candidates[0];
  return { name, category: "Alcoholes", id: existing === undefined ? undefined : String(existing.id), providerKnown: existing ? catalogue.some(p => p.id === existing.id && p.proveedor_id !== null) : false };
});
for (const id of softDrinkIds) {
  const product = catalogue.find(p => p.id === id && p.proveedor_id === belater);
  if (!product) throw new Error(`Belater catalogue item unavailable: ${id}`);
  plan.push({ name: String(product.nombre), category: "Refrescos", id, providerKnown: true });
}
console.log(JSON.stringify({ mode: process.argv.includes("--apply") ? "apply" : "preview", location: "Bar", countUnit: "botella", drinks: plan }, null, 2));
if (process.argv.includes("--apply")) {
  const columns = await sql`select column_name from information_schema.columns where table_schema='public' and table_name='inventario_bebidas_productos' and column_name in ('categoria','unidad_conteo')`;
  if (columns.length !== 2) throw new Error("Deploy migration 0023 and the updated app before importing drinks");
  const before = await sql`select b.*,p.nombre,p.unidad from inventario_bebidas_productos b join productos p on p.id=b.producto_id`;
  mkdirSync("backups/database", { recursive: true, mode: 0o700 });
  writeFileSync(`backups/database/bar-drinks-before-${Date.now()}.json`, JSON.stringify(before, null, 2), { mode: 0o600 });
  // One HTTP transaction: serialize imports, reuse products, never change catalogue names/units/prices.
  const queries = [sql`select pg_advisory_xact_lock(1790806168)`];
  for (const item of plan) {
    queries.push(sql`with existing as (
      select id from productos where eliminado_at is null and (${item.id ?? null}::uuid = id or (${item.id ?? null}::uuid is null and lower(trim(nombre))=lower(trim(${item.name})) and unidad='unidad'))
    ), created as (
      insert into productos(nombre,unidad,unidad_id) select ${item.name},'unidad',${unit.id}::uuid where not exists(select 1 from existing) returning id
    ) insert into inventario_bebidas_productos(producto_id,ubicacion,categoria,unidad_conteo)
      select id,'Bar',${item.category},'botella' from (select id from existing union all select id from created) p
      on conflict(producto_id,ubicacion) do nothing`);
  }
  await sql.transaction(queries);
  const result = await sql`select b.categoria,count(*)::int total,count(pp.producto_id)::int con_proveedor from inventario_bebidas_productos b left join proveedor_productos pp on pp.producto_id=b.producto_id where b.ubicacion='Bar' and b.activo group by b.categoria`;
  console.log("Verified import:", JSON.stringify(result));
}

}
void main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
