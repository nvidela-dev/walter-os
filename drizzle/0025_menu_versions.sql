CREATE TABLE "menu_versiones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"carta" text NOT NULL,
	"estado" text DEFAULT 'draft' NOT NULL,
	"version_base_id" uuid,
	"revision" integer DEFAULT 0 NOT NULL,
	"contenido" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"presentado_at" timestamp with time zone,
	"creado_por" text NOT NULL,
	"presentado_por" text,
	CONSTRAINT "menu_versiones_estado_check" CHECK ("menu_versiones"."estado" in ('draft','submitted')),
	CONSTRAINT "menu_versiones_revision_check" CHECK ("menu_versiones"."revision" >= 0),
	CONSTRAINT "menu_versiones_snapshot_check" CHECK (("menu_versiones"."estado"='draft' AND "menu_versiones"."presentado_at" IS NULL AND "menu_versiones"."presentado_por" IS NULL) OR ("menu_versiones"."estado"='submitted' AND "menu_versiones"."presentado_at" IS NOT NULL AND "menu_versiones"."presentado_por" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "menu_versiones" ADD CONSTRAINT "menu_versiones_base_fk" FOREIGN KEY ("version_base_id") REFERENCES "public"."menu_versiones"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "menu_versiones_carta_estado_fecha" ON "menu_versiones" USING btree ("carta","estado","presentado_at" DESC NULLS LAST);
--> statement-breakpoint
-- Preserve the existing catalogue without changing any original row or identity.
INSERT INTO public.menu_versiones(carta,estado,contenido,creado_por,presentado_por,presentado_at)
SELECT family,'submitted',jsonb_build_object(
  'sections', coalesce((SELECT jsonb_agg(jsonb_build_object('id',s.id,'name',s.nombre,'sortOrder',s.orden) ORDER BY s.orden,s.id) FROM public.menu_secciones s WHERE s.carta=family),
    '[{"id":"00000000-0000-4000-8000-000000000001","name":"Sin clasificar","sortOrder":0}]'::jsonb),
  'items',coalesce((SELECT jsonb_agg(jsonb_build_object(
    'id',m.id,'name',coalesce(to_jsonb(m)->>'nombre','Ítem sin nombre'),'description',to_jsonb(m)->>'descripcion',
    'sellPrice',m.precio_venta::text,'sectionId',coalesce(m.seccion_id,'00000000-0000-4000-8000-000000000001'::uuid),
    'priceOptions',m.opciones_precio,'sourceNote',m.fuente,'sourceKey',m.clave_fuente,'reviewNote',m.nota_revision,'sortOrder',m.orden,'recipeId',to_jsonb(m)->>'receta_id'
  ) ORDER BY m.orden,m.id) FROM public.menu m LEFT JOIN public.menu_secciones s ON s.id=m.seccion_id WHERE coalesce(s.carta,'Sin clasificar')=family),'[]'::jsonb)
),'migration:existing-catalogue','migration:existing-catalogue',clock_timestamp()
FROM (SELECT carta AS family FROM public.menu_secciones UNION SELECT 'Sin clasificar' WHERE EXISTS(SELECT 1 FROM public.menu WHERE seccion_id IS NULL)) families;

CREATE FUNCTION public.menu_version_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.estado='submitted' THEN RAISE EXCEPTION 'Submitted menus are immutable'; END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  IF NEW.carta<>OLD.carta THEN RAISE EXCEPTION 'Menu family cannot change'; END IF;
  RETURN NEW;
END;$$;
CREATE TRIGGER menu_versiones_inmutables BEFORE UPDATE OR DELETE ON public.menu_versiones FOR EACH ROW EXECUTE FUNCTION public.menu_version_immutable();

-- Submission serializes per family, validates the exact reviewed revision and
-- baseline, then freezes that draft atomically. Concurrent edits cannot slip in.
CREATE FUNCTION public.submit_menu_version(draft_id uuid, expected_revision integer, expected_base uuid, actor text) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE family text; draft public.menu_versiones%ROWTYPE; latest uuid;
BEGIN
  SELECT carta INTO family FROM public.menu_versiones WHERE id=draft_id;
  IF family IS NULL THEN RAISE EXCEPTION 'menu_conflict'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('menu:'||family,0));
  SELECT * INTO draft FROM public.menu_versiones WHERE id=draft_id FOR UPDATE;
  SELECT id INTO latest FROM public.menu_versiones WHERE carta=family AND estado='submitted' ORDER BY presentado_at DESC,id DESC LIMIT 1;
  IF draft.estado<>'draft' OR draft.revision<>expected_revision OR draft.version_base_id IS DISTINCT FROM expected_base OR latest IS DISTINCT FROM expected_base THEN
    RAISE EXCEPTION 'menu_conflict';
  END IF;
  IF jsonb_array_length(draft.contenido->'items')=0 THEN RAISE EXCEPTION 'menu_empty'; END IF;
  UPDATE public.menu_versiones SET estado='submitted',revision=revision+1,presentado_at=clock_timestamp(),presentado_por=actor WHERE id=draft_id;
  RETURN draft_id;
END;$$;

-- Also stop older clients and legacy imports from bypassing the version workflow.
CREATE FUNCTION public.menu_legacy_readonly() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS(SELECT 1 FROM public.menu_versiones) THEN
    RAISE EXCEPTION 'Menu history is active; create a new menu draft';
  END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;$$;
CREATE TRIGGER menu_legacy_readonly BEFORE INSERT OR UPDATE OR DELETE ON public.menu FOR EACH ROW EXECUTE FUNCTION public.menu_legacy_readonly();
CREATE TRIGGER menu_sections_legacy_readonly BEFORE INSERT OR UPDATE OR DELETE ON public.menu_secciones FOR EACH ROW EXECUTE FUNCTION public.menu_legacy_readonly();
