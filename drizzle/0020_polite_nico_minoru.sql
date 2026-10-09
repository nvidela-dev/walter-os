CREATE TABLE "inventario_bebidas_productos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"producto_id" uuid NOT NULL,
	"ubicacion" text NOT NULL,
	"cantidad_objetivo" numeric(12, 2),
	"unidad_objetivo" text,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bebidas_producto_ubicacion_unique" UNIQUE("producto_id","ubicacion"),
	CONSTRAINT "bebidas_objetivo_nonnegative" CHECK ("inventario_bebidas_productos"."cantidad_objetivo" >= 0 AND "inventario_bebidas_productos"."cantidad_objetivo" < 10000000000),
	CONSTRAINT "bebidas_objetivo_unit_pair" CHECK (("inventario_bebidas_productos"."cantidad_objetivo" IS NULL) = ("inventario_bebidas_productos"."unidad_objetivo" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "observaciones_bebidas" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "observaciones_bebidas_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"item_id" uuid NOT NULL,
	"semana" date DEFAULT public.inventory_week((now() AT TIME ZONE 'America/Montevideo')::date) NOT NULL,
	"nombre" text NOT NULL,
	"ubicacion" text NOT NULL,
	"cantidad" numeric(12, 2) NOT NULL,
	"unidad" text NOT NULL,
	"registrado_at" timestamp with time zone DEFAULT now() NOT NULL,
	"registrado_por" text NOT NULL,
	CONSTRAINT "bebidas_cantidad_nonnegative" CHECK ("observaciones_bebidas"."cantidad" >= 0 AND "observaciones_bebidas"."cantidad" < 10000000000),
	CONSTRAINT "bebidas_semana_tuesday" CHECK (extract(dow FROM "observaciones_bebidas"."semana") = 2)
);
--> statement-breakpoint
CREATE TABLE "usuarios_bebidas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usuarios_bebidas_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "inventario_bebidas_productos" ADD CONSTRAINT "inventario_bebidas_productos_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observaciones_bebidas" ADD CONSTRAINT "observaciones_bebidas_item_id_inventario_bebidas_productos_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."inventario_bebidas_productos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bebidas_latest_idx" ON "observaciones_bebidas" USING btree ("semana","item_id","registrado_at" DESC NULLS LAST,"id" DESC NULLS LAST);--> statement-breakpoint
CREATE TRIGGER bebidas_observaciones_inmutables
BEFORE UPDATE OR DELETE ON public.observaciones_bebidas
FOR EACH ROW EXECUTE FUNCTION public.impedir_cambio_observacion();
--> statement-breakpoint
CREATE FUNCTION public.bebidas_snapshot() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE current_unit text;
BEGIN
  -- Only database time determines the active week; snapshots remain historical.
  NEW.registrado_at := now();
  NEW.semana := public.inventory_week((NEW.registrado_at AT TIME ZONE 'America/Montevideo')::date);
  SELECT p.nombre, p.unidad, b.ubicacion INTO NEW.nombre, current_unit, NEW.ubicacion
    FROM public.inventario_bebidas_productos b JOIN public.productos p ON p.id=b.producto_id
    WHERE b.id=NEW.item_id AND b.activo;
  IF NOT FOUND THEN RAISE EXCEPTION 'Drink item is not active'; END IF;
  IF NEW.unidad <> current_unit THEN RAISE EXCEPTION 'Drink unit changed; reload before counting'; END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER bebidas_snapshot_insert BEFORE INSERT ON public.observaciones_bebidas
FOR EACH ROW EXECUTE FUNCTION public.bebidas_snapshot();
