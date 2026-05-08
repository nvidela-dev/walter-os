CREATE TABLE "unidades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codigo" text NOT NULL,
	"nombre" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unidades_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
INSERT INTO "unidades" ("codigo", "nombre") VALUES
	('unidad', 'Unidad'),
	('kg', 'Kilogramo'),
	('g', 'Gramo'),
	('litro', 'Litro'),
	('ml', 'Mililitro'),
	('docena', 'Docena'),
	('pack', 'Pack');
--> statement-breakpoint
ALTER TABLE "productos" ADD COLUMN "unidad_id" uuid;--> statement-breakpoint
ALTER TABLE "productos" ADD CONSTRAINT "productos_unidad_id_unidades_id_fk" FOREIGN KEY ("unidad_id") REFERENCES "public"."unidades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
UPDATE "productos" p
SET "unidad_id" = u."id"
FROM "unidades" u
WHERE lower(trim(p."unidad")) = u."codigo";--> statement-breakpoint
DO $$
DECLARE
	orphan_count int;
	orphan_values text;
BEGIN
	SELECT count(*), string_agg(DISTINCT unidad, ', ')
	INTO orphan_count, orphan_values
	FROM "productos"
	WHERE "unidad_id" IS NULL;
	IF orphan_count > 0 THEN
		RAISE EXCEPTION 'migration aborted: % productos rows have unmatched unidad values: %. Add the missing codigo(s) to the unidades seed and retry.', orphan_count, orphan_values;
	END IF;
END $$;
