CREATE TABLE "uso_lectura_facturas" (
	"clave" text PRIMARY KEY NOT NULL,
	"dia" date NOT NULL,
	"cantidad" integer NOT NULL,
	"ultimo_at" timestamp with time zone NOT NULL,
	CONSTRAINT "uso_lectura_facturas_cantidad" CHECK ("uso_lectura_facturas"."cantidad" > 0)
);
