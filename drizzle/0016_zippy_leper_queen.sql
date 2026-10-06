CREATE TABLE "inventario_items" (
	"inventario_id" bigint NOT NULL,
	"heladera_id" uuid NOT NULL,
	"producto_id" uuid NOT NULL,
	"heladera_numero" integer NOT NULL,
	"heladera_nombre" text,
	"producto_nombre" text NOT NULL,
	"nota" text,
	"cantidad" numeric(12, 2) NOT NULL,
	"unidad" text NOT NULL,
	"cambio" numeric(13, 2),
	"registrado_at" timestamp with time zone NOT NULL,
	"observacion_id" bigint NOT NULL,
	CONSTRAINT "inventario_items_inventario_id_heladera_id_producto_id_pk" PRIMARY KEY("inventario_id","heladera_id","producto_id")
);
--> statement-breakpoint
CREATE TABLE "inventarios" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "inventarios_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"fecha" date NOT NULL,
	CONSTRAINT "inventarios_fecha_unique" UNIQUE("fecha")
);
--> statement-breakpoint
ALTER TABLE "inventario_items" ADD CONSTRAINT "inventario_items_inventario_id_inventarios_id_fk" FOREIGN KEY ("inventario_id") REFERENCES "public"."inventarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventario_items" ADD CONSTRAINT "inventario_items_heladera_id_heladeras_id_fk" FOREIGN KEY ("heladera_id") REFERENCES "public"."heladeras"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventario_items" ADD CONSTRAINT "inventario_items_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventario_items" ADD CONSTRAINT "inventario_items_observacion_id_observaciones_inventario_id_fk" FOREIGN KEY ("observacion_id") REFERENCES "public"."observaciones_inventario"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE FUNCTION public.inventory_record_run(o public.observaciones_inventario) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  run_id bigint;
  prior_id bigint;
  run_day date := (o.registrado_at AT TIME ZONE 'America/Montevideo')::date;
  prior_quantity numeric;
  prior_unit text;
BEGIN
  -- Serialize concurrent Kitchen saves so every day has one coherent run.
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
--> statement-breakpoint
CREATE FUNCTION public.inventory_run_on_count() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM public.inventory_record_run(NEW);
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER observaciones_inventario_run AFTER INSERT ON public.observaciones_inventario
  FOR EACH ROW EXECUTE FUNCTION public.inventory_run_on_count();
--> statement-breakpoint
DO $$
DECLARE o public.observaciones_inventario;
BEGIN
  -- Consolidate existing saves into daily runs without updating audit observations.
  FOR o IN SELECT latest.* FROM (
    SELECT DISTINCT ON ((registrado_at AT TIME ZONE 'America/Montevideo')::date,heladera_id,producto_id) *
      FROM public.observaciones_inventario
      ORDER BY (registrado_at AT TIME ZONE 'America/Montevideo')::date,heladera_id,producto_id,registrado_at DESC,id DESC
  ) latest ORDER BY registrado_at,id LOOP
    PERFORM public.inventory_record_run(o);
  END LOOP;
END;
$$;
