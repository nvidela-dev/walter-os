CREATE OR REPLACE FUNCTION public.inventory_week(day date) RETURNS date
LANGUAGE sql IMMUTABLE STRICT AS $$ SELECT day - ((extract(dow FROM day)::integer + 5) % 7); $$;
--> statement-breakpoint
LOCK TABLE public.observaciones_inventario, public.inventarios, public.inventario_items IN ACCESS EXCLUSIVE MODE;
--> statement-breakpoint
-- Preserve counted snapshots and audit observations while consolidating daily headers.
CREATE TEMP TABLE weekly_inventory_headers ON COMMIT DROP AS
  SELECT min(id) id, public.inventory_week(fecha) fecha FROM public.inventarios GROUP BY public.inventory_week(fecha);
CREATE TEMP TABLE weekly_inventory_entries ON COMMIT DROP AS
  SELECT DISTINCT ON (h.id,e.heladera_id,e.producto_id) h.id weekly_id,e.*
  FROM public.inventario_items e JOIN public.inventarios r ON r.id=e.inventario_id
  JOIN weekly_inventory_headers h ON h.fecha=public.inventory_week(r.fecha)
  ORDER BY h.id,e.heladera_id,e.producto_id,e.registrado_at DESC,e.observacion_id DESC;
DELETE FROM public.inventario_items;
DELETE FROM public.inventarios;
INSERT INTO public.inventarios(id,fecha) OVERRIDING SYSTEM VALUE SELECT id,fecha FROM weekly_inventory_headers;
INSERT INTO public.inventario_items SELECT weekly_id,heladera_id,producto_id,heladera_numero,heladera_nombre,producto_nombre,nota,cantidad,unidad,NULL,registrado_at,observacion_id FROM weekly_inventory_entries;
UPDATE public.inventario_items e SET cambio=(
 SELECT CASE WHEN p.unidad=e.unidad THEN e.cantidad-p.cantidad ELSE NULL END FROM public.inventario_items p
 WHERE p.inventario_id=(SELECT id FROM public.inventarios WHERE fecha < (SELECT fecha FROM public.inventarios WHERE id=e.inventario_id) ORDER BY fecha DESC LIMIT 1)
 AND p.heladera_id=e.heladera_id AND p.producto_id=e.producto_id
);
ALTER TABLE public.inventarios ADD CONSTRAINT inventarios_fecha_tuesday CHECK (extract(dow FROM fecha)=2);
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.inventory_record_run(o public.observaciones_inventario) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  run_id bigint;
  prior_id bigint;
  run_day date := public.inventory_week((o.registrado_at AT TIME ZONE 'America/Montevideo')::date);
  prior_quantity numeric;
  prior_unit text;
BEGIN
  -- Serialize concurrent Kitchen saves so every week has one coherent run.
  PERFORM pg_advisory_xact_lock(1790806168);
  INSERT INTO public.inventarios(fecha) VALUES(run_day)
    ON CONFLICT(fecha) DO UPDATE SET fecha=EXCLUDED.fecha RETURNING id INTO run_id;
  SELECT id INTO prior_id FROM public.inventarios WHERE fecha < run_day ORDER BY fecha DESC LIMIT 1;
  SELECT cantidad, unidad INTO prior_quantity, prior_unit FROM public.inventario_items
    WHERE inventario_id=prior_id AND heladera_id=o.heladera_id AND producto_id=o.producto_id;
  INSERT INTO public.inventario_items(inventario_id,heladera_id,producto_id,heladera_numero,heladera_nombre,producto_nombre,nota,cantidad,unidad,cambio,registrado_at,observacion_id)
    SELECT run_id,o.heladera_id,o.producto_id,h.numero,h.nombre,p.nombre,hp.nota,o.cantidad,o.unidad,
      CASE WHEN prior_unit=o.unidad THEN o.cantidad-prior_quantity ELSE NULL END,o.registrado_at,o.id
    FROM public.heladeras h JOIN public.heladera_productos hp ON hp.heladera_id=h.id
      JOIN public.productos p ON p.id=hp.producto_id
    WHERE h.id=o.heladera_id AND p.id=o.producto_id
    ON CONFLICT(inventario_id,heladera_id,producto_id) DO UPDATE SET
      heladera_numero=EXCLUDED.heladera_numero,heladera_nombre=EXCLUDED.heladera_nombre,
      producto_nombre=EXCLUDED.producto_nombre,nota=EXCLUDED.nota,cantidad=EXCLUDED.cantidad,
      unidad=EXCLUDED.unidad,cambio=EXCLUDED.cambio,registrado_at=EXCLUDED.registrado_at,observacion_id=EXCLUDED.observacion_id
    WHERE EXCLUDED.registrado_at > inventario_items.registrado_at OR
      (EXCLUDED.registrado_at=inventario_items.registrado_at AND EXCLUDED.observacion_id>inventario_items.observacion_id);
END;
$$;
