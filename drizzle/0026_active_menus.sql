CREATE TABLE "menus_activos" (
	"carta" text PRIMARY KEY NOT NULL,
	"version_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "menus_activos" ADD CONSTRAINT "menus_activos_version_id_menu_versiones_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."menu_versiones"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
INSERT INTO public.menus_activos(carta,version_id)
SELECT DISTINCT ON(carta) carta,id FROM public.menu_versiones WHERE estado='submitted' ORDER BY carta,presentado_at DESC,id DESC;

CREATE FUNCTION public.validate_active_menu() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE latest uuid;
BEGIN
  IF TG_OP='DELETE' THEN RAISE EXCEPTION 'An active menu cannot be removed'; END IF;
  IF TG_OP='UPDATE' AND NEW.carta<>OLD.carta THEN RAISE EXCEPTION 'Active menu family cannot change'; END IF;
  SELECT id INTO latest FROM public.menu_versiones WHERE carta=NEW.carta AND estado='submitted' ORDER BY presentado_at DESC,id DESC LIMIT 1;
  IF latest IS NULL OR latest<>NEW.version_id THEN RAISE EXCEPTION 'Active menu must be the latest submitted version of its family'; END IF;
  RETURN NEW;
END;$$;
CREATE TRIGGER menus_activos_validar BEFORE INSERT OR UPDATE OR DELETE ON public.menus_activos FOR EACH ROW EXECUTE FUNCTION public.validate_active_menu();

CREATE FUNCTION public.activate_submitted_menu() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('menu:'||NEW.carta,0));
  INSERT INTO public.menus_activos(carta,version_id) VALUES(NEW.carta,NEW.id)
    ON CONFLICT(carta) DO UPDATE SET version_id=EXCLUDED.version_id;
  RETURN NEW;
END;$$;
CREATE TRIGGER menu_versiones_activar AFTER INSERT OR UPDATE ON public.menu_versiones FOR EACH ROW WHEN(NEW.estado='submitted') EXECUTE FUNCTION public.activate_submitted_menu();

CREATE OR REPLACE FUNCTION public.submit_menu_version(draft_id uuid, expected_revision integer, expected_base uuid, actor text) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE family text; draft public.menu_versiones%ROWTYPE; latest uuid;
BEGIN
  SELECT carta INTO family FROM public.menu_versiones WHERE id=draft_id;
  IF family IS NULL THEN RAISE EXCEPTION 'menu_conflict'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('menu:'||family,0));
  SELECT * INTO draft FROM public.menu_versiones WHERE id=draft_id FOR UPDATE;
  SELECT version_id INTO latest FROM public.menus_activos WHERE carta=family;
  IF draft.estado<>'draft' OR draft.revision<>expected_revision OR draft.version_base_id IS DISTINCT FROM expected_base OR latest IS DISTINCT FROM expected_base THEN
    RAISE EXCEPTION 'menu_conflict';
  END IF;
  IF jsonb_array_length(draft.contenido->'items')=0 THEN RAISE EXCEPTION 'menu_empty'; END IF;
  UPDATE public.menu_versiones SET estado='submitted',revision=revision+1,presentado_at=clock_timestamp(),presentado_por=actor WHERE id=draft_id;
  RETURN draft_id;
END;$$;
