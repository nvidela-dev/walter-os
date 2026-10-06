import { readFileSync } from "node:fs";

/** Only the reviewed inventory migration; never replay the legacy migration ledger. */
export function inventoryBootstrapSql(): string {
  const migration = readFileSync("drizzle/0012_inventory.sql", "utf8");
  const visibilityMigration = readFileSync("drizzle/0013_soft_valkyrie.sql", "utf8");
  return `
DO $inventory_bootstrap$
DECLARE
  existing_count integer;
BEGIN
  PERFORM pg_advisory_xact_lock(1790806167);
  SELECT count(*) INTO existing_count FROM pg_tables
    WHERE schemaname = 'public' AND tablename IN
      ('heladeras', 'heladera_productos', 'observaciones_inventario', 'usuarios_inventario');
  IF existing_count = 0 THEN
    ${migration}
  ELSIF existing_count <> 4 THEN
    RAISE EXCEPTION 'Partial inventory schema: refusing automatic repair';
  END IF;

  -- Fail the deployment rather than silently accepting an incomplete installation.
  PERFORM id, numero, nombre, activa, created_at, updated_at FROM public.heladeras LIMIT 0;
  PERFORM heladera_id, producto_id, created_at FROM public.heladera_productos LIMIT 0;
  PERFORM id, heladera_id, producto_id, cantidad, unidad, registrado_at, registrado_por
    FROM public.observaciones_inventario LIMIT 0;
  PERFORM id, email, created_at FROM public.usuarios_inventario LIMIT 0;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = 'public.observaciones_inventario'::regclass
    AND tgname = 'observaciones_inmutables' AND tgenabled = 'O') THEN
    RAISE EXCEPTION 'Inventory append-only trigger is missing or disabled';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'heladera_productos' AND column_name = 'activo') THEN
    ${visibilityMigration}
  END IF;
  PERFORM activo FROM public.heladera_productos LIMIT 0;

  -- Access is assigned explicitly by an Admin, never by deployment.
END;
$inventory_bootstrap$;`;
}
