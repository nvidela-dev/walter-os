CREATE TYPE "public"."proveedor_tipo" AS ENUM('producto', 'servicio');--> statement-breakpoint
ALTER TABLE "proveedores" ADD COLUMN "tipo" "proveedor_tipo" DEFAULT 'producto' NOT NULL;