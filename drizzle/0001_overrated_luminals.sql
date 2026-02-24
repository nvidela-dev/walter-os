CREATE TABLE "pagos_servicios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"servicio_id" uuid NOT NULL,
	"monto" numeric(10, 2) NOT NULL,
	"fecha" date NOT NULL,
	"notas" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pagos_servicios" ADD CONSTRAINT "pagos_servicios_servicio_id_servicios_id_fk" FOREIGN KEY ("servicio_id") REFERENCES "public"."servicios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "servicios" DROP COLUMN "monto_fijo";--> statement-breakpoint
ALTER TABLE "servicios" DROP COLUMN "frecuencia";