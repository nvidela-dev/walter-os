ALTER TABLE "productos" ADD COLUMN "eliminado_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "productos" ADD COLUMN "eliminado_por" text;