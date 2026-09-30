CREATE TABLE "heladera_productos" (
	"heladera_id" uuid NOT NULL,
	"producto_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "heladera_productos_heladera_id_producto_id_pk" PRIMARY KEY("heladera_id","producto_id")
);
--> statement-breakpoint
CREATE TABLE "heladeras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numero" integer NOT NULL,
	"nombre" text,
	"activa" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "heladeras_numero_unique" UNIQUE("numero"),
	CONSTRAINT "heladeras_numero_positive" CHECK ("heladeras"."numero" > 0)
);
--> statement-breakpoint
CREATE TABLE "usuarios_inventario" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usuarios_inventario_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "observaciones_inventario" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "observaciones_inventario_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"heladera_id" uuid NOT NULL,
	"producto_id" uuid NOT NULL,
	"cantidad" numeric(12, 2) NOT NULL,
	"unidad" text NOT NULL,
	"registrado_at" timestamp with time zone DEFAULT now() NOT NULL,
	"registrado_por" text NOT NULL,
	CONSTRAINT "observaciones_cantidad_nonnegative" CHECK ("observaciones_inventario"."cantidad" >= 0 AND "observaciones_inventario"."cantidad" < 10000000000)
);
--> statement-breakpoint
ALTER TABLE "heladera_productos" ADD CONSTRAINT "heladera_productos_heladera_id_heladeras_id_fk" FOREIGN KEY ("heladera_id") REFERENCES "public"."heladeras"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "heladera_productos" ADD CONSTRAINT "heladera_productos_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "observaciones_inventario" ADD CONSTRAINT "observaciones_inventario_heladera_id_producto_id_heladera_productos_heladera_id_producto_id_fk" FOREIGN KEY ("heladera_id","producto_id") REFERENCES "public"."heladera_productos"("heladera_id","producto_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "observaciones_latest_idx" ON "observaciones_inventario" USING btree ("heladera_id","producto_id","registrado_at" DESC NULLS LAST,"id" DESC NULLS LAST);
--> statement-breakpoint
-- Historical counts are append-only, including writes outside the application.
CREATE FUNCTION impedir_cambio_observacion() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Inventory observations are append-only';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER observaciones_inmutables
BEFORE UPDATE OR DELETE ON observaciones_inventario
FOR EACH ROW EXECUTE FUNCTION impedir_cambio_observacion();
