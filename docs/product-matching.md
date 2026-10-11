# Back office / equivalencias

`/product-matching` es una consola compacta para Admin, accesible desde Inicio. Conserva la app de asignación manual de proveedores (`/data-fill`) y los inventarios existentes.

## Revisar

Alternar **inventario → catálogo** o **catálogo → inventario**. La tabla izquierda permite buscar por nombre, proveedor o ID. Seleccionar un producto para ver sus coincidencias a la derecha. Los filtros son: todos, auto, sugeridos, sin vínculo, revisados y archivados.

- `match`: confirmar la equivalencia.
- `reject`: descartar el par; también deshace una confirmación o vínculo automático.
- **catálogo completo** o el campo de búsqueda: buscar manualmente más allá de las recomendaciones. También permite recuperar un par descartado.
- `archive`: archivar el producto **globalmente**, no solo ocultar esta fila ni rechazar el par.
- `restore`: recuperar el producto desde **archivados**. El último archivo también se puede deshacer con el comando mostrado tras guardarlo.

Los nombres idénticos normalizados forman vínculos automáticos revisables. Las demás recomendaciones son hipótesis preparadas por Codex al leer el catálogo de octubre de 2026, más coincidencias por palabras completas para nombres nuevos. No hay llamadas a un servicio de IA. Variantes inciertas mantienen alternativas y requieren confirmación. Varias equivalencias por producto siguen permitidas; el sentido de la pantalla no cambia las identidades del par.

Las decisiones se guardan en `equivalencias_productos` por par, con usuario y fecha; la última revisión prevalece. No fusionan productos ni cambian proveedores, precios, cantidades o unidades. Tampoco prueban de dónde vino el stock. Las otras apps todavía no utilizan las equivalencias.

## Archivo reversible

`productos.eliminado_at` y `eliminado_por` registran el archivo. Los registros, relaciones, ubicaciones, equivalencias, precios históricos, observaciones y facturas se conservan. Las listas activas de inventario, planificación, bebidas, proveedores y selección para nuevas operaciones excluyen productos archivados. Las acciones rechazan selecciones obsoletas de esos productos. Los históricos y las referencias de recetas ya existentes conservan el producto para no alterar registros anteriores.

Restaurar limpia la marca sin recrear el producto ni asignaciones. Solo Admin puede archivar/restaurar. La migración añade columnas nulas: no archiva ningún producto existente. El bootstrap de Vercel la aplica y rechaza una instalación parcial.

## Snapshot previo

Antes de estos cambios se guardó y verificó el snapshot indicado en `docs/database-baselines/README.md`. El archivo privado contiene 26 tablas y 1.187 filas. La nueva migración fue probada sobre esa copia restaurada: preservó todos los valores originales. No se ejecuta ni reemplaza el historial de migraciones existente con la línea base.
