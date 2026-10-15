# Catálogo de Menú

En Inicio → Menú se editan las cartas Don Juan y Genüsse en un mismo lugar. Cada carta conserva sus propias secciones, ítems y precios de venta. No se fusionan productos por nombre: Corona 710 ml conserva 350 en Don Juan y 300 en Genüsse.

El catálogo permite buscar ítems, agregar/renombrar/ordenar secciones y editar nombres, descripciones, orden, precios, tamaños/opciones y notas de revisión. Los precios pueden quedar pendientes; nunca se reemplazan por cero. Las pizzas conservan dos opciones de precio y las alternativas de sabores/salsas se conservan como texto, sin crear combinaciones ficticias. Los ítems anteriores quedan disponibles en Sin clasificar.

Las filas importadas guardan su fuente. Dos picadas tienen ingredientes parcialmente ilegibles y Premium Smash tiene el precio tachado: se señalan para revisión. Los cambios posteriores no son sobrescritos al repetir la carga.

Los ítems de menú no se vinculan automáticamente con productos, inventario, proveedores ni recetas. La interfaz no ofrece asociación a receta; las asociaciones anteriores, si existían, se conservan. Los precios son exclusivamente de venta. No se genera aún una carta imprimible.

La excepción solicitada son las cervezas: una carga independiente agrega 20 cervezas no tiradas al inventario de Bar. Reutiliza cinco identidades claras y sus vínculos existentes; no agrega proveedores, precios de compra, conteos ni objetivos. Faxe se cuenta por unidad porque la foto no confirma botella. Las seis variedades de barril quedan pendientes de confirmar su unidad de conteo.

## Despliegue y carga

La migración 0024 y el bootstrap amplían el menú sin borrar datos y rechazan instalaciones parciales. Tras desplegar, ejecutar desde el repositorio:
- Vista previa: npx tsx scripts/import-menu-photos.ts
- Cargar los datos aprobados: npx tsx scripts/import-menu-photos.ts --apply

El script valida las fuentes, crea una copia privada y gitignored de las tablas afectadas, y realiza una transacción. Las claves de importación estables evitan duplicados. No reproduce el registro de migraciones antiguo ni publica fotos o copias de datos. La carga incluye 175 ítems y 26 secciones: 101 Don Juan y 74 Genüsse.
