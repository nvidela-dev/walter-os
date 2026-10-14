# Revisar duplicados

La sección **Revisar duplicados** está en Inicio → Relleno de Datos y junto a **Unir nombres**. Solo Admin puede abrirla o modificar productos.

Elegí un producto a la izquierda y comparalo con las sugerencias a la derecha. Se muestran IDs, unidades, proveedores, precios, heladeras, notas, fecha de creación y cantidad de registros históricos. **Buscar en todos** permite revisar un par que no fue sugerido. Elegí cuál conservar y revisá los dos IDs antes de **Confirmar archivo**.

Las sugerencias comparan nombres normalizados, variantes de escritura y las hipótesis usadas para equivalencias. El mismo proveedor y la misma heladera aumentan la prioridad. Un par descartado en Unir nombres no aparece como sugerencia; seleccionarlo manualmente muestra la decisión anterior. Los nombres genéricos como Varios no generan sugerencias. Son candidatos, no confirmaciones automáticas.

## Qué ocurre al confirmar

Se archiva globalmente solo el producto elegido: desaparece de las listas activas. El producto conservado debe seguir activo al guardar. Se preservan ambos IDs y todas las relaciones, facturas, equivalencias y observaciones; los conteos no se suman ni se trasladan. Los proveedores y ubicaciones del registro archivado tampoco se copian al conservado. La comparación permite detectar cuando el inventario y el catálogo representan el mismo ingrediente, pero mantienen intencionalmente dos identidades; en ese caso conviene usar Unir nombres.

**Deshacer archivo** recupera el último producto archivado. **Archivados → restaurar** funciona también después de recargar o volver más tarde. El archivo usa las columnas y el usuario de auditoría existentes: no requiere migración nueva, no elimina filas y no fusiona historial. La restauración recupera sus ubicaciones y vínculos originales.

## Límites

La sección no guarda una nueva relación permanente entre el ID conservado y el archivado ni nuevas decisiones de descarte; utiliza el archivo global existente y los descartes de equivalencias. No convierte packs, kilos y unidades ni infiere que dos variantes sean iguales. Revisar una sugerencia no cambia la base de datos: solo el archivo confirmado o la restauración la modifica.
