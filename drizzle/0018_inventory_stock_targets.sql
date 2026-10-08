CREATE TABLE "historial_objetivos_inventario" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "historial_objetivos_inventario_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"producto_id" uuid NOT NULL,
	"cantidad" numeric(12, 2) NOT NULL,
	"unidad" text NOT NULL,
	"registrado_at" timestamp with time zone DEFAULT now() NOT NULL,
	"registrado_por" text NOT NULL,
	CONSTRAINT "objetivos_id_product_unique" UNIQUE("id","producto_id"),
	CONSTRAINT "objetivos_cantidad_nonnegative" CHECK ("historial_objetivos_inventario"."cantidad" >= 0 AND "historial_objetivos_inventario"."cantidad" < 10000000000)
);
--> statement-breakpoint
CREATE TABLE "objetivos_inventario_activos" (
	"producto_id" uuid PRIMARY KEY NOT NULL,
	"objetivo_id" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "historial_objetivos_inventario" ADD CONSTRAINT "historial_objetivos_inventario_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "objetivos_inventario_activos" ADD CONSTRAINT "objetivos_inventario_activos_objetivo_id_producto_id_historial_objetivos_inventario_id_producto_id_fk" FOREIGN KEY ("objetivo_id","producto_id") REFERENCES "public"."historial_objetivos_inventario"("id","producto_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "objetivos_history_idx" ON "historial_objetivos_inventario" USING btree ("producto_id","id" DESC NULLS LAST);--> statement-breakpoint
CREATE FUNCTION public.inventory_target_on_insert() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.objetivos_inventario_activos(producto_id,objetivo_id) VALUES(NEW.producto_id,NEW.id)
    ON CONFLICT(producto_id) DO UPDATE SET objetivo_id=EXCLUDED.objetivo_id
    WHERE EXCLUDED.objetivo_id > objetivos_inventario_activos.objetivo_id;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER objetivos_actualizar AFTER INSERT ON public.historial_objetivos_inventario
  FOR EACH ROW EXECUTE FUNCTION public.inventory_target_on_insert();
--> statement-breakpoint
CREATE FUNCTION public.inventory_target_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Inventory target history is append-only';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER objetivos_inmutables BEFORE UPDATE OR DELETE ON public.historial_objetivos_inventario
  FOR EACH ROW EXECUTE FUNCTION public.inventory_target_immutable();
