ALTER TABLE "inventario_bebidas_productos" ADD COLUMN "categoria" text DEFAULT 'Sin categoría' NOT NULL;--> statement-breakpoint
ALTER TABLE "inventario_bebidas_productos" ADD COLUMN "unidad_conteo" text;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.bebidas_snapshot() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE current_unit text;
BEGIN
  -- Only database time determines the active week; snapshots remain historical.
  NEW.registrado_at := now();
  NEW.semana := public.inventory_week((NEW.registrado_at AT TIME ZONE 'America/Montevideo')::date);
  SELECT p.nombre, coalesce(b.unidad_conteo, p.unidad), b.ubicacion INTO NEW.nombre, current_unit, NEW.ubicacion
    FROM public.inventario_bebidas_productos b JOIN public.productos p ON p.id=b.producto_id
    WHERE b.id=NEW.item_id AND b.activo;
  IF NOT FOUND THEN RAISE EXCEPTION 'Drink item is not active'; END IF;
  IF NEW.unidad <> current_unit THEN RAISE EXCEPTION 'Drink unit changed; reload before counting'; END IF;
  RETURN NEW;
END;
$$;
