CREATE TABLE "documentos_bebidas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fecha" date NOT NULL,
	"categoria" text NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"creado_por" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "documentos_bebidas_fecha_categoria" UNIQUE("fecha","categoria"),
	CONSTRAINT "documentos_bebidas_categoria" CHECK ("documentos_bebidas"."categoria" in ('Alcoholes','Cervezas','Refrescos')),
	CONSTRAINT "documentos_bebidas_revision" CHECK ("documentos_bebidas"."revision" >= 0)
);
--> statement-breakpoint
CREATE TABLE "ediciones_documentos_bebidas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"documento_id" uuid NOT NULL,
	"usuario" text NOT NULL,
	"nombre_usuario" text NOT NULL,
	"fecha" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ediciones_documentos_bebidas" ADD CONSTRAINT "ediciones_documentos_bebidas_documento_id_documentos_bebidas_id_fk" FOREIGN KEY ("documento_id") REFERENCES "public"."documentos_bebidas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ediciones_documentos_fecha" ON "ediciones_documentos_bebidas" USING btree ("documento_id","fecha" DESC NULLS LAST);
--> statement-breakpoint
-- Lock legacy saves while moving their latest values into dated documents.
LOCK TABLE public.observaciones_bebidas IN ACCESS EXCLUSIVE MODE;
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM public.observaciones_bebidas o JOIN public.inventario_bebidas_productos b ON b.id=o.item_id WHERE b.categoria NOT IN ('Alcoholes','Cervezas','Refrescos')) THEN
    RAISE EXCEPTION 'Legacy counts require an explicit drink category before conversion';
  END IF;
END;$$;
INSERT INTO public.documentos_bebidas(fecha,categoria,creado_por,created_at,updated_at)
SELECT (o.registrado_at AT TIME ZONE 'America/Montevideo')::date,b.categoria,
 (array_agg(o.registrado_por ORDER BY o.registrado_at,o.id))[1],min(o.registrado_at),max(o.registrado_at)
FROM public.observaciones_bebidas o JOIN public.inventario_bebidas_productos b ON b.id=o.item_id GROUP BY 1,2;
UPDATE public.documentos_bebidas d SET items=coalesce((
 SELECT jsonb_agg(jsonb_build_object('itemId',b.id,'name',coalesce(o.nombre,p.nombre),'location',coalesce(o.ubicacion,b.ubicacion),'unit',coalesce(o.unidad,b.unidad_conteo,to_jsonb(p)->>'unidad'),'quantity',o.cantidad::text) ORDER BY b.ubicacion,p.nombre,b.id)
 FROM public.inventario_bebidas_productos b JOIN public.productos p ON p.id=b.producto_id
 LEFT JOIN LATERAL(SELECT o.* FROM public.observaciones_bebidas o WHERE o.item_id=b.id AND (o.registrado_at AT TIME ZONE 'America/Montevideo')::date=d.fecha ORDER BY o.registrado_at DESC,o.id DESC LIMIT 1) o ON true
 WHERE b.categoria=d.categoria AND ((b.activo AND p.eliminado_at IS NULL) OR o.id IS NOT NULL)
),'[]'::jsonb);
INSERT INTO public.ediciones_documentos_bebidas(documento_id,usuario,nombre_usuario,fecha)
SELECT DISTINCT d.id,o.registrado_por,o.registrado_por,o.registrado_at FROM public.observaciones_bebidas o JOIN public.inventario_bebidas_productos b ON b.id=o.item_id
JOIN public.documentos_bebidas d ON d.categoria=b.categoria AND d.fecha=(o.registrado_at AT TIME ZONE 'America/Montevideo')::date;
-- Abort the whole migration if a latest saved value or its identity was lost.
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM (
   SELECT DISTINCT ON(b.categoria,(o.registrado_at AT TIME ZONE 'America/Montevideo')::date,o.item_id) o.*,b.categoria
   FROM public.observaciones_bebidas o JOIN public.inventario_bebidas_productos b ON b.id=o.item_id
   ORDER BY b.categoria,(o.registrado_at AT TIME ZONE 'America/Montevideo')::date,o.item_id,o.registrado_at DESC,o.id DESC
 ) o WHERE NOT EXISTS(SELECT 1 FROM public.documentos_bebidas d CROSS JOIN LATERAL jsonb_array_elements(d.items) item
   WHERE d.categoria=o.categoria AND d.fecha=(o.registrado_at AT TIME ZONE 'America/Montevideo')::date
   AND item->>'itemId'=o.item_id::text AND (item->>'quantity')::numeric=o.cantidad
   AND item->>'name'=o.nombre AND item->>'unit'=o.unidad AND item->>'location'=o.ubicacion)) THEN
 RAISE EXCEPTION 'Latest legacy drink counts were not preserved'; END IF;
END;$$;
-- Prior count values are not an edit log. Only current values survive conversion.
ALTER TABLE public.observaciones_bebidas DISABLE TRIGGER bebidas_observaciones_inmutables;
DELETE FROM public.observaciones_bebidas;
ALTER TABLE public.observaciones_bebidas ENABLE TRIGGER bebidas_observaciones_inmutables;
CREATE FUNCTION public.drinks_legacy_closed() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Open a drinks document to save counts'; END;$$;
CREATE TRIGGER bebidas_documentos_solo BEFORE INSERT ON public.observaciones_bebidas FOR EACH ROW EXECUTE FUNCTION public.drinks_legacy_closed();
CREATE FUNCTION public.drink_document_identity_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Drink documents cannot be deleted'; END IF;
 IF NEW.fecha<>OLD.fecha OR NEW.categoria<>OLD.categoria OR NEW.creado_por<>OLD.creado_por OR NEW.created_at<>OLD.created_at THEN RAISE EXCEPTION 'Drink document identity cannot change'; END IF;
 RETURN NEW;
END;$$;
CREATE TRIGGER documentos_bebidas_identidad BEFORE UPDATE OR DELETE ON public.documentos_bebidas FOR EACH ROW EXECUTE FUNCTION public.drink_document_identity_guard();
CREATE FUNCTION public.drink_edit_event_immutable() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Edit events are immutable'; END;$$;
CREATE TRIGGER ediciones_bebidas_inmutables BEFORE UPDATE OR DELETE ON public.ediciones_documentos_bebidas FOR EACH ROW EXECUTE FUNCTION public.drink_edit_event_immutable();

CREATE FUNCTION public.save_drink_document(doc_id uuid, expected_revision integer, counts jsonb, actor text, actor_name text, is_admin boolean) RETURNS void LANGUAGE plpgsql AS $$
DECLARE doc public.documentos_bebidas%ROWTYPE; entry jsonb; previous jsonb; built jsonb:='[]'::jsonb; item_name text; item_location text; item_unit text; qty numeric;
BEGIN
 SELECT * INTO doc FROM public.documentos_bebidas WHERE id=doc_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'drink_missing'; END IF;
 IF doc.creado_por<>actor AND NOT is_admin THEN RAISE EXCEPTION 'drink_denied'; END IF;
 IF doc.revision<>expected_revision THEN RAISE EXCEPTION 'drink_conflict'; END IF;
 IF jsonb_typeof(counts)<>'array' OR jsonb_array_length(counts)>1000 THEN RAISE EXCEPTION 'drink_invalid'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(doc.items) old WHERE NOT EXISTS(SELECT 1 FROM jsonb_array_elements(counts) c WHERE c->>'itemId'=old->>'itemId'))
 OR (SELECT count(*)<>count(DISTINCT c->>'itemId') FROM jsonb_array_elements(counts) c) THEN RAISE EXCEPTION 'drink_invalid'; END IF;
 FOR entry IN SELECT value FROM jsonb_array_elements(counts) LOOP
   SELECT value INTO previous FROM jsonb_array_elements(doc.items) WHERE value->>'itemId'=entry->>'itemId';
   IF previous IS NOT NULL THEN
     item_name:=previous->>'name';item_location:=previous->>'location';item_unit:=previous->>'unit';
   ELSE
     SELECT p.nombre,b.ubicacion,coalesce(b.unidad_conteo,p.unidad) INTO item_name,item_location,item_unit
     FROM public.inventario_bebidas_productos b JOIN public.productos p ON p.id=b.producto_id
     WHERE b.id=(entry->>'itemId')::uuid AND b.categoria=doc.categoria AND b.activo AND p.eliminado_at IS NULL;
     IF NOT FOUND THEN RAISE EXCEPTION 'drink_invalid'; END IF;
   END IF;
   IF item_unit IS DISTINCT FROM entry->>'unit' THEN RAISE EXCEPTION 'drink_unit'; END IF;
   qty:=(entry->>'quantity')::numeric;
   IF qty<0 OR qty>=10000000000 OR scale(qty)>2 THEN RAISE EXCEPTION 'drink_invalid'; END IF;
   built:=built||jsonb_build_array(jsonb_build_object('itemId',entry->>'itemId','name',item_name,'location',item_location,'unit',item_unit,'quantity',CASE WHEN qty IS NULL THEN NULL ELSE qty::text END));
 END LOOP;
 UPDATE public.documentos_bebidas SET items=built,revision=revision+1,updated_at=clock_timestamp() WHERE id=doc_id;
 INSERT INTO public.ediciones_documentos_bebidas(documento_id,usuario,nombre_usuario,fecha) VALUES(doc_id,actor,actor_name,clock_timestamp());
END;$$;
