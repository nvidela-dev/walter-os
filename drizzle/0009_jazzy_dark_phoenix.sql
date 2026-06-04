ALTER TABLE "proveedor_productos" DROP CONSTRAINT "proveedor_productos_proveedor_id_proveedores_id_fk";
--> statement-breakpoint
ALTER TABLE "proveedor_productos" DROP CONSTRAINT "proveedor_productos_producto_id_productos_id_fk";
--> statement-breakpoint
ALTER TABLE "horas_extra" DROP CONSTRAINT "horas_extra_empleado_id_empleados_id_fk";
--> statement-breakpoint
ALTER TABLE "receta_productos" DROP CONSTRAINT "receta_productos_producto_id_productos_id_fk";
--> statement-breakpoint
ALTER TABLE "facturas" DROP CONSTRAINT "facturas_proveedor_id_proveedores_id_fk";
--> statement-breakpoint
ALTER TABLE "factura_lineas" DROP CONSTRAINT "factura_lineas_factura_id_facturas_id_fk";
--> statement-breakpoint
ALTER TABLE "historial_precios" DROP CONSTRAINT "historial_precios_producto_id_productos_id_fk";
--> statement-breakpoint
ALTER TABLE "historial_precios" DROP CONSTRAINT "historial_precios_proveedor_id_proveedores_id_fk";
--> statement-breakpoint
ALTER TABLE "proveedor_productos" ADD CONSTRAINT "proveedor_productos_proveedor_id_proveedores_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id") ON DELETE restrict ON UPDATE no action NOT VALID;--> statement-breakpoint
ALTER TABLE "proveedor_productos" VALIDATE CONSTRAINT "proveedor_productos_proveedor_id_proveedores_id_fk";--> statement-breakpoint
ALTER TABLE "proveedor_productos" ADD CONSTRAINT "proveedor_productos_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE restrict ON UPDATE no action NOT VALID;--> statement-breakpoint
ALTER TABLE "proveedor_productos" VALIDATE CONSTRAINT "proveedor_productos_producto_id_productos_id_fk";--> statement-breakpoint
ALTER TABLE "horas_extra" ADD CONSTRAINT "horas_extra_empleado_id_empleados_id_fk" FOREIGN KEY ("empleado_id") REFERENCES "public"."empleados"("id") ON DELETE restrict ON UPDATE no action NOT VALID;--> statement-breakpoint
ALTER TABLE "horas_extra" VALIDATE CONSTRAINT "horas_extra_empleado_id_empleados_id_fk";--> statement-breakpoint
ALTER TABLE "receta_productos" ADD CONSTRAINT "receta_productos_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE restrict ON UPDATE no action NOT VALID;--> statement-breakpoint
ALTER TABLE "receta_productos" VALIDATE CONSTRAINT "receta_productos_producto_id_productos_id_fk";--> statement-breakpoint
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_proveedor_id_proveedores_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id") ON DELETE restrict ON UPDATE no action NOT VALID;--> statement-breakpoint
ALTER TABLE "facturas" VALIDATE CONSTRAINT "facturas_proveedor_id_proveedores_id_fk";--> statement-breakpoint
ALTER TABLE "factura_lineas" ADD CONSTRAINT "factura_lineas_factura_id_facturas_id_fk" FOREIGN KEY ("factura_id") REFERENCES "public"."facturas"("id") ON DELETE restrict ON UPDATE no action NOT VALID;--> statement-breakpoint
ALTER TABLE "factura_lineas" VALIDATE CONSTRAINT "factura_lineas_factura_id_facturas_id_fk";--> statement-breakpoint
ALTER TABLE "historial_precios" ADD CONSTRAINT "historial_precios_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE restrict ON UPDATE no action NOT VALID;--> statement-breakpoint
ALTER TABLE "historial_precios" VALIDATE CONSTRAINT "historial_precios_producto_id_productos_id_fk";--> statement-breakpoint
ALTER TABLE "historial_precios" ADD CONSTRAINT "historial_precios_proveedor_id_proveedores_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedores"("id") ON DELETE restrict ON UPDATE no action NOT VALID;--> statement-breakpoint
ALTER TABLE "historial_precios" VALIDATE CONSTRAINT "historial_precios_proveedor_id_proveedores_id_fk";--> statement-breakpoint
ALTER TABLE "proveedores" ADD CONSTRAINT "proveedores_deuda_nonnegative" CHECK ("proveedores"."deuda" >= 0) NOT VALID;--> statement-breakpoint
ALTER TABLE "proveedores" VALIDATE CONSTRAINT "proveedores_deuda_nonnegative";--> statement-breakpoint
ALTER TABLE "proveedor_productos" ADD CONSTRAINT "proveedor_productos_precio_positive" CHECK ("proveedor_productos"."precio" > 0) NOT VALID;--> statement-breakpoint
ALTER TABLE "proveedor_productos" VALIDATE CONSTRAINT "proveedor_productos_precio_positive";--> statement-breakpoint
ALTER TABLE "proveedor_productos" ADD CONSTRAINT "proveedor_productos_cantidad_positive" CHECK ("proveedor_productos"."cantidad" > 0) NOT VALID;--> statement-breakpoint
ALTER TABLE "proveedor_productos" VALIDATE CONSTRAINT "proveedor_productos_cantidad_positive";--> statement-breakpoint
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_salario_mensual_positive" CHECK ("empleados"."salario_mensual" > 0) NOT VALID;--> statement-breakpoint
ALTER TABLE "empleados" VALIDATE CONSTRAINT "empleados_salario_mensual_positive";--> statement-breakpoint
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_horas_fijas_semanales_positive" CHECK ("empleados"."horas_fijas_semanales" > 0) NOT VALID;--> statement-breakpoint
ALTER TABLE "empleados" VALIDATE CONSTRAINT "empleados_horas_fijas_semanales_positive";--> statement-breakpoint
ALTER TABLE "horas_extra" ADD CONSTRAINT "horas_extra_horas_positive" CHECK ("horas_extra"."horas" > 0) NOT VALID;--> statement-breakpoint
ALTER TABLE "horas_extra" VALIDATE CONSTRAINT "horas_extra_horas_positive";--> statement-breakpoint
ALTER TABLE "horas_extra" ADD CONSTRAINT "horas_extra_monto_pagado_positive" CHECK ("horas_extra"."monto_pagado" > 0) NOT VALID;--> statement-breakpoint
ALTER TABLE "horas_extra" VALIDATE CONSTRAINT "horas_extra_monto_pagado_positive";--> statement-breakpoint
ALTER TABLE "receta_productos" ADD CONSTRAINT "receta_productos_cantidad_positive" CHECK ("receta_productos"."cantidad" > 0) NOT VALID;--> statement-breakpoint
ALTER TABLE "receta_productos" VALIDATE CONSTRAINT "receta_productos_cantidad_positive";--> statement-breakpoint
ALTER TABLE "menu" ADD CONSTRAINT "menu_precio_venta_positive" CHECK ("menu"."precio_venta" > 0) NOT VALID;--> statement-breakpoint
ALTER TABLE "menu" VALIDATE CONSTRAINT "menu_precio_venta_positive";--> statement-breakpoint
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_total_positive" CHECK ("facturas"."total" > 0) NOT VALID;--> statement-breakpoint
ALTER TABLE "facturas" VALIDATE CONSTRAINT "facturas_total_positive";--> statement-breakpoint
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_monto_positive" CHECK ("facturas"."monto" IS NULL OR "facturas"."monto" > 0) NOT VALID;--> statement-breakpoint
ALTER TABLE "facturas" VALIDATE CONSTRAINT "facturas_monto_positive";--> statement-breakpoint
ALTER TABLE "factura_lineas" ADD CONSTRAINT "factura_lineas_precio_unit_positive" CHECK ("factura_lineas"."precio_unit" > 0) NOT VALID;--> statement-breakpoint
ALTER TABLE "factura_lineas" VALIDATE CONSTRAINT "factura_lineas_precio_unit_positive";--> statement-breakpoint
ALTER TABLE "factura_lineas" ADD CONSTRAINT "factura_lineas_cantidad_positive" CHECK ("factura_lineas"."cantidad" > 0) NOT VALID;--> statement-breakpoint
ALTER TABLE "factura_lineas" VALIDATE CONSTRAINT "factura_lineas_cantidad_positive";--> statement-breakpoint
ALTER TABLE "factura_lineas" ADD CONSTRAINT "factura_lineas_total_positive" CHECK ("factura_lineas"."total" > 0) NOT VALID;--> statement-breakpoint
ALTER TABLE "factura_lineas" VALIDATE CONSTRAINT "factura_lineas_total_positive";--> statement-breakpoint
ALTER TABLE "historial_precios" ADD CONSTRAINT "historial_precios_precio_positive" CHECK ("historial_precios"."precio" > 0) NOT VALID;--> statement-breakpoint
ALTER TABLE "historial_precios" VALIDATE CONSTRAINT "historial_precios_precio_positive";
