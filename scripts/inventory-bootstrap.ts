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
  const providerLinkMigration = readFileSync("drizzle/0019_true_unicorn.sql", "utf8");
  const drinksMigration = readFileSync("drizzle/0020_polite_nico_minoru.sql", "utf8");
  const matchingMigration = readFileSync("drizzle/0021_neat_jasper_sitwell.sql", "utf8").replaceAll("--> statement-breakpoint", "");
  const archiveMigration = readFileSync("drizzle/0022_daffy_smiling_tiger.sql", "utf8").replaceAll("--> statement-breakpoint", "");
  const drinkCategoriesMigration = readFileSync("drizzle/0023_drink_categories.sql", "utf8").replaceAll("--> statement-breakpoint", "");
  const menuMigration = readFileSync("drizzle/0024_optimal_colleen_wing.sql", "utf8").replaceAll("--> statement-breakpoint", "");
  const menuVersionsMigration = readFileSync("drizzle/0025_menu_versions.sql", "utf8").replaceAll("--> statement-breakpoint", "");
  const activeMenusMigration = readFileSync("drizzle/0026_active_menus.sql", "utf8").replaceAll("--> statement-breakpoint", "");
  const drinkDocumentsMigration = readFileSync("drizzle/0027_drink_documents.sql", "utf8").replaceAll("--> statement-breakpoint", "");
  const deletionMigration = readFileSync("drizzle/0029_inventory_deletion.sql", "utf8");
  const scanUsageMigration = readFileSync("drizzle/0028_clammy_tigra.sql", "utf8").replaceAll("--> statement-breakpoint", "");
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

  -- Provider matching can be saved before its price is known.
  IF EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'proveedor_productos'
      AND column_name = 'precio' AND is_nullable = 'NO') THEN
    ${providerLinkMigration}
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'proveedor_productos'
      AND column_name = 'precio' AND is_nullable = 'YES') THEN
    RAISE EXCEPTION 'Provider catalogue price must allow unknown values';
  END IF;

  SELECT count(*) INTO existing_count FROM pg_tables
    WHERE schemaname='public' AND tablename IN ('usuarios_bebidas','inventario_bebidas_productos','observaciones_bebidas');
  IF existing_count = 0 THEN
    ${drinksMigration}
  ELSIF existing_count <> 3 THEN
    RAISE EXCEPTION 'Partial drinks schema: refusing automatic repair';
  END IF;
  PERFORM id, email FROM public.usuarios_bebidas LIMIT 0;
  PERFORM id, producto_id, ubicacion, cantidad_objetivo, unidad_objetivo, activo FROM public.inventario_bebidas_productos LIMIT 0;
  PERFORM id, item_id, semana, nombre, ubicacion, cantidad, unidad, registrado_at, registrado_por FROM public.observaciones_bebidas LIMIT 0;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid='public.observaciones_bebidas'::regclass AND tgname='bebidas_observaciones_inmutables' AND tgenabled='O')
    OR NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid='public.observaciones_bebidas'::regclass AND tgname='bebidas_snapshot_insert' AND tgenabled='O') THEN
    RAISE EXCEPTION 'Drinks inventory triggers are missing or disabled';
  END IF;

  IF to_regclass('public.equivalencias_productos') IS NULL THEN
    ${matchingMigration}
  END IF;
  PERFORM inventario_producto_id, catalogo_producto_id, estado, revisado_por, revisado_at FROM public.equivalencias_productos LIMIT 0;

  SELECT count(*) INTO existing_count FROM information_schema.columns
    WHERE table_schema='public' AND table_name='productos' AND column_name IN ('eliminado_at','eliminado_por');
  IF existing_count = 0 THEN
    ${archiveMigration}
  ELSIF existing_count <> 2 THEN
    RAISE EXCEPTION 'Partial product archive schema: refusing automatic repair';
  END IF;
  PERFORM eliminado_at, eliminado_por FROM public.productos LIMIT 0;

  SELECT count(*) INTO existing_count FROM information_schema.columns
    WHERE table_schema='public' AND table_name='inventario_bebidas_productos' AND column_name IN ('categoria','unidad_conteo');
  IF existing_count = 0 THEN
    ${drinkCategoriesMigration}
  ELSIF existing_count <> 2 THEN
    RAISE EXCEPTION 'Partial drink categories schema: refusing automatic repair';
  END IF;
  PERFORM categoria, unidad_conteo FROM public.inventario_bebidas_productos LIMIT 0;
  IF position('unidad_conteo' in pg_get_functiondef('public.bebidas_snapshot()'::regprocedure)) = 0 THEN
    RAISE EXCEPTION 'Drinks snapshot must use the counting unit';
  END IF;

  SELECT count(*) INTO existing_count FROM information_schema.columns
    WHERE table_schema='public' AND table_name='menu'
      AND column_name IN ('seccion_id','opciones_precio','clave_fuente','fuente','nota_revision','orden');
  IF existing_count = 0 AND to_regclass('public.menu_secciones') IS NULL THEN
    ${menuMigration}
  ELSIF existing_count <> 6 OR to_regclass('public.menu_secciones') IS NULL THEN
    RAISE EXCEPTION 'Partial menu catalogue schema: refusing automatic repair';
  END IF;
  PERFORM id, carta, nombre, orden FROM public.menu_secciones LIMIT 0;
  PERFORM seccion_id, opciones_precio, clave_fuente, fuente, nota_revision, orden FROM public.menu LIMIT 0;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='menu' AND column_name='precio_venta' AND is_nullable='YES') THEN
    RAISE EXCEPTION 'Menu catalogue must allow pending prices';
  END IF;

  IF to_regclass('public.menu_versiones') IS NULL THEN
    ${menuVersionsMigration}
  END IF;
  PERFORM id,carta,estado,version_base_id,revision,contenido,created_at,presentado_at,creado_por,presentado_por FROM public.menu_versiones LIMIT 0;
  IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.menu_versiones'::regclass AND tgname='menu_versiones_inmutables' AND tgenabled='O')
    OR to_regprocedure('public.submit_menu_version(uuid,integer,uuid,text)') IS NULL
    OR NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.menu'::regclass AND tgname='menu_legacy_readonly' AND tgenabled='O')
    OR NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.menu_secciones'::regclass AND tgname='menu_sections_legacy_readonly' AND tgenabled='O') THEN
    RAISE EXCEPTION 'Menu version immutability or submission function is missing';
  END IF;

  IF to_regclass('public.menus_activos') IS NULL THEN
    ${activeMenusMigration}
  END IF;
  PERFORM carta,version_id FROM public.menus_activos LIMIT 0;
  IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.menus_activos'::regclass AND tgname='menus_activos_validar' AND tgenabled='O')
    OR NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.menu_versiones'::regclass AND tgname='menu_versiones_activar' AND tgenabled='O')
    OR position('menus_activos' in pg_get_functiondef('public.submit_menu_version(uuid,integer,uuid,text)'::regprocedure))=0 THEN
    RAISE EXCEPTION 'Active menu constraints or submission function are missing';
  END IF;
  IF EXISTS(SELECT 1 FROM (SELECT DISTINCT ON(carta) carta,id FROM public.menu_versiones WHERE estado='submitted' ORDER BY carta,presentado_at DESC,id DESC) v
    LEFT JOIN public.menus_activos a ON a.carta=v.carta WHERE a.version_id IS DISTINCT FROM v.id)
    OR EXISTS(SELECT 1 FROM public.menus_activos a JOIN public.menu_versiones v ON v.id=a.version_id WHERE v.carta<>a.carta OR v.estado<>'submitted') THEN
    RAISE EXCEPTION 'Active menu is inconsistent with submitted history';
  END IF;

  SELECT count(*) INTO existing_count FROM pg_tables WHERE schemaname='public' AND tablename IN ('documentos_bebidas','ediciones_documentos_bebidas');
  IF existing_count=0 THEN
    ${drinkDocumentsMigration}
  ELSIF existing_count<>2 THEN RAISE EXCEPTION 'Partial drinks document schema: refusing automatic repair';
  END IF;
  PERFORM id,fecha,categoria,items,revision,creado_por,created_at,updated_at FROM public.documentos_bebidas LIMIT 0;
  PERFORM id,documento_id,usuario,nombre_usuario,fecha FROM public.ediciones_documentos_bebidas LIMIT 0;
  IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.documentos_bebidas'::regclass AND tgname='documentos_bebidas_identidad' AND tgenabled='O')
    OR NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.ediciones_documentos_bebidas'::regclass AND tgname='ediciones_bebidas_inmutables' AND tgenabled='O')
    OR NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.observaciones_bebidas'::regclass AND tgname='bebidas_documentos_solo' AND tgenabled='O')
    OR NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.documentos_bebidas'::regclass AND conname='documentos_bebidas_fecha_categoria')
    OR to_regprocedure('public.save_drink_document(uuid,integer,jsonb,text,text,boolean)') IS NULL
    OR EXISTS(SELECT 1 FROM public.observaciones_bebidas) THEN
    RAISE EXCEPTION 'Drinks document guards or save function are missing, or legacy counts remain';
  END IF;

  IF to_regclass('public.uso_lectura_facturas') IS NULL THEN
    ${scanUsageMigration}
  END IF;
  PERFORM clave,dia,cantidad,ultimo_at FROM public.uso_lectura_facturas LIMIT 0;
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.uso_lectura_facturas'::regclass AND contype='p')
    OR NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.uso_lectura_facturas'::regclass AND conname='uso_lectura_facturas_cantidad') THEN
    RAISE EXCEPTION 'Invoice scan usage constraints are missing';
  END IF;

  IF to_regprocedure('public.delete_drink_document(uuid,integer,text,boolean)') IS NULL
    AND to_regprocedure('public.delete_inventory_run(bigint,text)') IS NULL THEN
    ${deletionMigration}
  ELSIF to_regprocedure('public.delete_drink_document(uuid,integer,text,boolean)') IS NULL
    OR to_regprocedure('public.delete_inventory_run(bigint,text)') IS NULL THEN
    RAISE EXCEPTION 'Partial inventory deletion functions';
  END IF;

  -- Access is assigned explicitly by an Admin, never by deployment.
END;
$inventory_bootstrap$;`;
}
