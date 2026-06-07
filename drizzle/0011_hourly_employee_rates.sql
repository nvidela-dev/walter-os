ALTER TABLE "empleados" DROP CONSTRAINT "empleados_salario_mensual_positive";--> statement-breakpoint
ALTER TABLE "empleados" ADD COLUMN "tarifa_hora" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "empleados" ADD COLUMN "tarifa_hora_extra" numeric(10, 2);--> statement-breakpoint
UPDATE "empleados"
SET
	"tarifa_hora" = GREATEST(
		COALESCE(round(("salario_mensual" / NULLIF(("horas_fijas_semanales"::numeric * (52.0 / 12.0)), 0))::numeric, 2), 0.01),
		0.01
	),
	"tarifa_hora_extra" = GREATEST(
		COALESCE(round(("salario_mensual" / NULLIF(("horas_fijas_semanales"::numeric * (52.0 / 12.0)), 0))::numeric, 2), 0.01),
		0.01
	)
WHERE "tarifa_hora" IS NULL OR "tarifa_hora_extra" IS NULL;--> statement-breakpoint
ALTER TABLE "empleados" ALTER COLUMN "tarifa_hora" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "empleados" ALTER COLUMN "tarifa_hora_extra" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "empleados" DROP COLUMN "salario_mensual";--> statement-breakpoint
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_tarifa_hora_positive" CHECK ("empleados"."tarifa_hora" > 0) NOT VALID;--> statement-breakpoint
ALTER TABLE "empleados" VALIDATE CONSTRAINT "empleados_tarifa_hora_positive";--> statement-breakpoint
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_tarifa_hora_extra_positive" CHECK ("empleados"."tarifa_hora_extra" > 0) NOT VALID;--> statement-breakpoint
ALTER TABLE "empleados" VALIDATE CONSTRAINT "empleados_tarifa_hora_extra_positive";
