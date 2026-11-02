CREATE TABLE "menu_secciones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"carta" text NOT NULL,
	"nombre" text NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "menu_secciones_carta_nombre_unique" UNIQUE("carta","nombre")
);
--> statement-breakpoint
ALTER TABLE "menu" ALTER COLUMN "precio_venta" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "menu" ADD COLUMN "seccion_id" uuid;--> statement-breakpoint
ALTER TABLE "menu" ADD COLUMN "opciones_precio" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "menu" ADD COLUMN "clave_fuente" text;--> statement-breakpoint
ALTER TABLE "menu" ADD COLUMN "fuente" text;--> statement-breakpoint
ALTER TABLE "menu" ADD COLUMN "nota_revision" text;--> statement-breakpoint
ALTER TABLE "menu" ADD COLUMN "orden" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "menu" ADD CONSTRAINT "menu_seccion_id_menu_secciones_id_fk" FOREIGN KEY ("seccion_id") REFERENCES "public"."menu_secciones"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu" ADD CONSTRAINT "menu_clave_fuente_unique" UNIQUE("clave_fuente");