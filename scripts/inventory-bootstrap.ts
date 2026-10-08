import { readFileSync } from "node:fs";

/** Only the reviewed inventory migration; never replay the legacy migration ledger. */
export function inventoryBootstrapSql(): string {
  const migration = readFileSync("drizzle/0012_inventory.sql", "utf8");
  const visibilityMigration = readFileSync("drizzle/0013_soft_valkyrie.sql", "utf8");
  const noteMigration = readFileSync("drizzle/0014_concerned_nemesis.sql", "utf8");
  const fridgeMigration = readFileSync("drizzle/0015_bored_mandroid.sql", "utf8");
  const runMigration = readFileSync("drizzle/0016_zippy_leper_queen.sql", "utf8");
  const weeklyMigration = readFileSync("drizzle/0017_weekly_inventory.sql", "utf8");
  const targetMigration = readFileSync("drizzle/0018_inventory_stock_targets.sql", "utf8");
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

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'heladera_productos' AND column_name = 'nota') THEN
    ${noteMigration}
  END IF;
  PERFORM nota FROM public.heladera_productos LIMIT 0;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'heladeras' AND column_name = 'comentario') THEN
    ${fridgeMigration}
  END IF;
  PERFORM comentario FROM public.heladeras LIMIT 0;

  IF to_regclass('public.inventarios') IS NULL AND to_regclass('public.inventario_items') IS NULL THEN
    ${runMigration}
  ELSIF to_regclass('public.inventarios') IS NULL OR to_regclass('public.inventario_items') IS NULL THEN
    RAISE EXCEPTION 'Partial inventory run schema: refusing automatic repair';
  END IF;
  PERFORM id, fecha FROM public.inventarios LIMIT 0;
  PERFORM inventario_id, heladera_id, producto_id, cantidad, unidad, cambio, observacion_id FROM public.inventario_items LIMIT 0;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid='public.observaciones_inventario'::regclass
    AND tgname='observaciones_inventario_run' AND tgenabled='O') THEN
    RAISE EXCEPTION 'Inventory run trigger is missing or disabled';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.inventarios'::regclass AND conname='inventarios_fecha_tuesday') THEN
    ${weeklyMigration}
  END IF;

  IF to_regclass('public.historial_objetivos_inventario') IS NULL AND to_regclass('public.objetivos_inventario_activos') IS NULL THEN
    ${targetMigration}
  ELSIF to_regclass('public.historial_objetivos_inventario') IS NULL OR to_regclass('public.objetivos_inventario_activos') IS NULL THEN
    RAISE EXCEPTION 'Partial inventory target schema: refusing automatic repair';
  END IF;
  PERFORM id, producto_id, cantidad, unidad, registrado_at, registrado_por FROM public.historial_objetivos_inventario LIMIT 0;
  PERFORM producto_id, objetivo_id FROM public.objetivos_inventario_activos LIMIT 0;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid='public.historial_objetivos_inventario'::regclass AND tgname='objetivos_inmutables' AND tgenabled='O')
    OR NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid='public.historial_objetivos_inventario'::regclass AND tgname='objetivos_actualizar' AND tgenabled='O') THEN
    RAISE EXCEPTION 'Inventory target triggers are missing or disabled';
  END IF;

  -- Access is assigned explicitly by an Admin, never by deployment.
END;
$inventory_bootstrap$;`;
}
