CREATE TABLE "productos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text,
	"unidad" text DEFAULT 'unidad' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proveedores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text,
	"logo_url" text,
	"deuda" numeric(10, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proveedor_productos" (
	"proveedor_id" uuid NOT NULL,
	"producto_id" uuid NOT NULL,
	"precio" numeric(10, 2) NOT NULL,
	"cantidad" numeric(10, 2) DEFAULT '1' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "proveedor_productos_proveedor_id_producto_id_pk" PRIMARY KEY("proveedor_id","producto_id")
);
--> statement-breakpoint
CREATE TABLE "servicios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text,
	"monto_fijo" numeric(10, 2) NOT NULL,
	"frecuencia" text DEFAULT 'mensual' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gastos_hogar" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text,
	"monto" numeric(10, 2) NOT NULL,
	"frecuencia" text DEFAULT 'mensual' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "empleados" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"salario_mensual" numeric(10, 2) NOT NULL,
	"horas_fijas_semanales" integer DEFAULT 40 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "horas_extra" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empleado_id" uuid NOT NULL,
	"fecha" date NOT NULL,
	"horas" integer NOT NULL,
	"monto_pagado" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recetas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "receta_productos" (
	"receta_id" uuid NOT NULL,
	"producto_id" uuid NOT NULL,
	"cantidad" numeric(10, 3) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "receta_productos_receta_id_producto_id_pk" PRIMARY KEY("receta_id","producto_id")
);
--> statement-breakpoint
CREATE TABLE "menu" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text,
	"precio_venta" numeric(10, 2) NOT NULL,
	"receta_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "proveedor_productos" ADD CONSTRAINT "proveedor_productos_proveedor_id_proveedores_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proveedor_productos" ADD CONSTRAINT "proveedor_productos_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "horas_extra" ADD CONSTRAINT "horas_extra_empleado_id_empleados_id_fk" FOREIGN KEY ("empleado_id") REFERENCES "public"."empleados"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receta_productos" ADD CONSTRAINT "receta_productos_receta_id_recetas_id_fk" FOREIGN KEY ("receta_id") REFERENCES "public"."recetas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receta_productos" ADD CONSTRAINT "receta_productos_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu" ADD CONSTRAINT "menu_receta_id_recetas_id_fk" FOREIGN KEY ("receta_id") REFERENCES "public"."recetas"("id") ON DELETE set null ON UPDATE no action;