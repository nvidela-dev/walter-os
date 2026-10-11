CREATE TABLE "equivalencias_productos" (
	"inventario_producto_id" uuid NOT NULL,
	"catalogo_producto_id" uuid NOT NULL,
	"estado" text NOT NULL,
	"revisado_por" text NOT NULL,
	"revisado_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "equivalencias_productos_inventario_producto_id_catalogo_producto_id_pk" PRIMARY KEY("inventario_producto_id","catalogo_producto_id"),
	CONSTRAINT "equivalencias_estado" CHECK ("equivalencias_productos"."estado" in ('accepted', 'rejected'))
);
--> statement-breakpoint
ALTER TABLE "equivalencias_productos" ADD CONSTRAINT "equivalencias_productos_inventario_producto_id_productos_id_fk" FOREIGN KEY ("inventario_producto_id") REFERENCES "public"."productos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equivalencias_productos" ADD CONSTRAINT "equivalencias_productos_catalogo_producto_id_productos_id_fk" FOREIGN KEY ("catalogo_producto_id") REFERENCES "public"."productos"("id") ON DELETE restrict ON UPDATE no action;