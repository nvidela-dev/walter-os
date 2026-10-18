-- Deletion is scoped by transaction-local identity, never by disabling triggers.
CREATE OR REPLACE FUNCTION public.drink_document_identity_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN
   IF current_setting('walter.delete_drink',true)=OLD.id::text THEN RETURN OLD; END IF;
   RAISE EXCEPTION 'Drink documents require confirmed deletion';
 END IF;
 IF NEW.fecha<>OLD.fecha OR NEW.categoria<>OLD.categoria OR NEW.creado_por<>OLD.creado_por OR NEW.created_at<>OLD.created_at THEN RAISE EXCEPTION 'Drink document identity cannot change'; END IF;
 RETURN NEW;
END;$$;
CREATE OR REPLACE FUNCTION public.drink_edit_event_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' AND current_setting('walter.delete_drink',true)=OLD.documento_id::text THEN RETURN OLD; END IF;
 RAISE EXCEPTION 'Edit events are immutable';
END;$$;
CREATE OR REPLACE FUNCTION public.impedir_cambio_observacion() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' AND current_setting('walter.delete_inventory_week',true)=public.inventory_week((OLD.registrado_at AT TIME ZONE 'America/Montevideo')::date)::text THEN RETURN OLD; END IF;
 RAISE EXCEPTION 'Inventory observations are append-only';
END;$$;

CREATE FUNCTION public.delete_drink_document(doc_id uuid, expected_revision integer, actor text, is_admin boolean) RETURNS void LANGUAGE plpgsql AS $$
DECLARE doc public.documentos_bebidas%ROWTYPE;
BEGIN
 SELECT * INTO doc FROM public.documentos_bebidas WHERE id=doc_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'delete_conflict'; END IF;
 IF NOT is_admin AND doc.creado_por<>actor THEN RAISE EXCEPTION 'delete_denied'; END IF;
 IF doc.revision<>expected_revision THEN RAISE EXCEPTION 'delete_conflict'; END IF;
 PERFORM set_config('walter.delete_drink',doc_id::text,true);
 DELETE FROM public.ediciones_documentos_bebidas WHERE documento_id=doc_id;
 DELETE FROM public.documentos_bebidas WHERE id=doc_id;
 PERFORM set_config('walter.delete_drink','',true);
END;$$;

CREATE FUNCTION public.delete_inventory_run(run_id bigint, expected_token text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE run_day date; token text;
BEGIN
 PERFORM pg_advisory_xact_lock(1790806168);
 SELECT fecha INTO run_day FROM public.inventarios WHERE id=run_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'delete_conflict'; END IF;
 SELECT md5(coalesce(string_agg(observacion_id::text,',' ORDER BY observacion_id),'')) INTO token FROM public.inventario_items WHERE inventario_id=run_id;
 IF token IS DISTINCT FROM expected_token THEN RAISE EXCEPTION 'delete_conflict'; END IF;
 DELETE FROM public.inventario_items WHERE inventario_id=run_id;
 DELETE FROM public.inventarios WHERE id=run_id;
 PERFORM set_config('walter.delete_inventory_week',run_day::text,true);
 DELETE FROM public.observaciones_inventario WHERE public.inventory_week((registrado_at AT TIME ZONE 'America/Montevideo')::date)=run_day;
 PERFORM set_config('walter.delete_inventory_week','',true);
 -- Refresh comparisons for remaining snapshots after removing a week.
 UPDATE public.inventario_items e SET cambio=(
   SELECT CASE WHEN p.unidad=e.unidad THEN e.cantidad-p.cantidad ELSE NULL END
   FROM public.inventario_items p WHERE p.inventario_id=(SELECT id FROM public.inventarios WHERE fecha<(SELECT fecha FROM public.inventarios WHERE id=e.inventario_id) ORDER BY fecha DESC LIMIT 1)
   AND p.heladera_id=e.heladera_id AND p.producto_id=e.producto_id
 );
END;$$;
