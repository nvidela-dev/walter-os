# Inventario: conteos de cocina, existencias previstas y compras

Este documento registra el flujo solicitado y lo distingue de la implementación
actual. Inspección del repositorio: **2026-10-07**, basada en el commit `e7fe957`.
Esta revisión es únicamente documental; no se inspeccionó producción ni se
modificó la aplicación para elaborar este documento.

El personal de cocina revisa cada heladera, informa cuánto stock hay y agrega
los productos que faltan en sus ubicaciones reales. Un único inventario compartido
abarca de martes a lunes. Después del conteo, el siguiente paso previsto es
comparar las existencias con la cantidad objetivo vigente y agrupar las
necesidades de compra resultantes por proveedor.

## Flujo de trabajo y cobertura actual

| Paso | Comportamiento requerido | Implementación actual |
| --- | --- | --- |
| Revisar heladeras | El personal de cocina revisa cada heladera e informa el estado de su inventario. | Existen páginas de heladeras, edición de cantidades, notas y un asistente con un paso por heladera. No se guarda un estado de completado o revisado. |
| Agregar productos | Todo producto de inventario tiene una ubicación en una heladera. | Cocina puede asociar un producto existente o crear el producto y su ubicación juntos. Un producto puede estar en varias heladeras. |
| Contar existencias | Registrar la cantidad real y la unidad de cada producto en cada heladera. | Implementado. Un campo vacío significa sin revisar; un cero explícito significa que no queda nada. |
| Mantener el inventario semanal | Las ediciones de martes a lunes pertenecen a una única instancia semanal compartida. | Implementado mediante la normalización de la fecha semanal, una fecha única y una restricción que exige que sea martes. |
| Mantener las existencias previstas | Cada producto tiene una cantidad objetivo, su propio historial y un único objetivo activo a la vez. | Previsto; no se encontró almacenamiento, historial ni interfaz de edición de objetivos. Falta decidir su alcance. |
| Calcular compras | Comparar las existencias observadas con el objetivo aplicable. | Previsto; las diferencias actuales comparan inventarios entre sí. |
| Agrupar por proveedor | Usar las asociaciones existentes entre productos y proveedores para organizar las cantidades a comprar. | Existen las asociaciones y la visualización de proveedores. No existen el cálculo de compras, la selección de proveedor ni el resultado agrupado. |

## Productos y ubicación en heladeras

`productos` es el catálogo compartido. `heladera_productos` asocia un producto
con una heladera; las cantidades se registran para ese par. Esto permite que
un mismo producto, como el arroz, esté en dos heladeras sin crear dos identidades
de producto.

La acción de creación de productos de inventario exige una heladera activa y
crea el producto y su ubicación de forma atómica. Al contar, se valida que el
producto pertenezca a esa heladera y que la asociación esté activa. Las claves
foráneas de la base de datos también exigen una ubicación para cada observación.
Estas garantías implementan la regla de ubicación para los conteos de inventario;
**no** exigen que todos los productos del catálogo general tengan una heladera.

Quitar una entrada de inventario actualmente oculta su asociación con la
heladera y conserva el producto y sus observaciones anteriores. Por lo tanto,
un producto puede quedarse sin ubicaciones activas. Falta decidir si la regla
prevista debe impedir ese estado o si ese producto simplemente queda fuera del
inventario activo.

Fuentes: [esquema de inventario](../src/db/schema/inventory.ts),
[esquema de productos](../src/db/schema/products.ts),
[acciones de inventario](../src/lib/actions/inventory.ts),
[validación de entradas](../src/lib/validators/inventory.ts).

## Un inventario por semana

La semana usa la zona horaria **America/Montevideo**, comienza el martes y termina
el lunes. Su identificador es la fecha del martes. Todos los usuarios de cocina
comparten la misma instancia. Por ejemplo:

- El martes 6 de octubre se crea **Martes 6 de octubre**.
- Las correcciones del viernes 9 de octubre actualizan ese mismo inventario.
- El lunes 12 de octubre sigue perteneciendo a ese inventario.
- El martes 13 de octubre comienza **Martes 13 de octubre**.

La base de datos guarda el último conteo de cada combinación de inventario
semanal, heladera y producto en `inventario_items`. Volver a iniciar la misma
semana reutiliza su registro de cabecera; guardar conteos actualiza el resumen
de esa semana. El asistente detecta si ya existe un inventario de la semana
actual, propone editarlo y precarga sus cantidades. En una semana nueva, los
productos sin contar permanecen desconocidos; no heredan los conteos anteriores.

La regla significa **como máximo una instancia por semana**, creada al iniciarla
o registrar el primer conteo. No existe un proceso programado que cree un
inventario para cada semana del calendario. Exigir que el personal termine un
inventario cada semana es un requisito operativo distinto; actualmente no hay
un control que obligue a completarlo.

Fuentes: [migración semanal y disparador de conteos](../drizzle/0017_weekly_inventory.sql),
[acciones de inicio y edición](../src/lib/actions/inventory.ts),
[cálculo de la semana y formato de etiquetas](../src/lib/inventory/run-display.ts),
[página del asistente](../src/app/inventory/new/page.tsx),
[interacción del asistente](../src/app/inventory/new/wizard.tsx).

## Historial de inventario e historial de existencias previstas

Responden preguntas diferentes y deben mantenerse separados:

| Historial | Pregunta que responde | Estado |
| --- | --- | --- |
| Historial de inventarios semanales | ¿Cuánto se registró para cada heladera y producto en cada semana de inventario? | Implementado mediante `inventarios` e `inventario_items`; la pantalla de historial muestra el último resumen de cada semana. |
| Historial de auditoría de conteos | ¿Quién registró qué cantidad y cuándo, incluidas las correcciones dentro de una semana? | Las filas inmutables de `observaciones_inventario` conservan cantidad, unidad, usuario y fecha y hora. La pantalla de historial semanal no muestra todas las correcciones de auditoría. |
| Historial de existencias previstas | ¿Qué cantidad se pretendía mantener y cómo cambió ese objetivo? | Requerido, pero no implementado. Necesita sus propios registros históricos y un único objetivo activo a la vez para el alcance elegido. |

Una corrección del viernes reemplaza la cantidad semanal mostrada y agrega una
observación de conteo, conservando la medición anterior en el historial de
auditoría. Esto no crea un segundo inventario semanal. Editar una nota sin
actualizar la cantidad no crea una observación ni una nueva instantánea histórica
semanal; las notas compartidas y los comentarios de heladera no constituyen una
auditoría completa de todas las ediciones.

Actualmente, `cambio` es el stock observado menos el stock comparable del
inventario anterior. Puede ser positivo, negativo o cero. Si falta el producto
en el inventario anterior o cambia la unidad, no se puede comparar. El inventario
inicial no tiene comparación previa. Esta diferencia no mide consumo ni calcula
qué comprar.

Fuentes: [observaciones inmutables](../drizzle/0012_inventory.sql),
[instantáneas semanales](../drizzle/0017_weekly_inventory.sql),
[consultas de inventarios](../src/lib/queries/inventory-runs.ts),
[interfaz del historial](../src/app/inventory/history/page.tsx).

## Cantidades previstas y necesidades de compra: comportamiento deseado

Cada producto de inventario debería tener una cantidad de stock objetivo y una
unidad. Cambiar ese plan debería conservar el objetivo anterior en su propio
historial, dejando un único objetivo activo a la vez. Ese historial no debe
deducirse de los conteos observados, las cantidades por paquete del proveedor ni
las compras anteriores.

Para una cantidad observada conocida y un objetivo aplicable en unidades
compatibles:

```text
faltante a comprar = max(stock objetivo - stock observado, 0)
```

Por ejemplo, un objetivo de 12 kg y un stock observado de 8 kg dan un faltante
de 4 kg. Un stock observado de 15 kg da un faltante de cero. Ese faltante es
distinto del cambio, con signo positivo o negativo, respecto del inventario anterior.

Antes de implementar este cálculo, hay que definir el alcance del objetivo:

- **Objetivo global por producto:** comparar con la suma completa de sus
  existencias en todas las heladeras. Una suma parcial no representa un conteo
  completo.
- **Objetivo por producto y heladera:** comparar cada ubicación con su propio
  objetivo activo. Decidir si el excedente de una heladera puede compensar el
  faltante de otra antes de sumar las compras; trasladar stock puede ser distinto
  de comprarlo.

El requisito del usuario es un único objetivo activo a la vez. El alcance anterior
determina si esa unicidad se aplica a un producto o a un par producto y heladera.
El esquema actual no establece ninguna de las dos opciones.

## De los faltantes a las compras por proveedor: comportamiento deseado

Las asociaciones existentes en `proveedor_productos` vinculan productos con
proveedores y contienen precio y cantidad por paquete. Un producto puede no tener
proveedor o tener varios. Actualmente el inventario muestra esas asociaciones;
no selecciona un proveedor ni genera grupos de compra.

Después de calcular faltantes válidos, se asigna cada faltante al proveedor
elegido y se agrupan las líneas de compra por proveedor. Cada grupo debe conservar
la identidad y unidad de los productos; cantidades de unidades diferentes no se
pueden sumar en un único total por proveedor. Una asociación identifica una
opción de compra, no demuestra quién suministró el stock observado.

| Situación | Qué se sabe | Regla pendiente |
| --- | --- | --- |
| Falta un conteo | El stock es desconocido; vacío no significa cero. | Cómo tratar un inventario incompleto al preparar una lista de compras. No presentar un faltante como definitivo a partir de stock desconocido. |
| Falta un objetivo | Puede conocerse el stock observado, pero no está definido el nivel deseado. | Cómo mostrar y resolver el objetivo faltante; no asumir un objetivo de cero. |
| Unidades incompatibles | Todavía no se pueden comparar stock y objetivo. | Qué conversiones se admiten y cuál es su fuente; no está establecida una conversión automática entre kg y unidades. |
| Sin proveedor | Puede existir un faltante sin asociación a un proveedor. | Cómo mostrar o asignar las líneas de compra sin resolver. |
| Varios proveedores | Hay varias asociaciones válidas. | Elección manual, proveedor preferido, reparto de la compra u otra política explícita. No duplicar el faltante entre proveedores. |
| Cantidades por paquete | Las asociaciones con proveedores tienen una cantidad por paquete. | Su significado y compatibilidad de unidades, el redondeo a paquetes enteros y si la cantidad mostrada corresponde a unidades de stock o a paquetes. |
| Cambios de objetivo durante o después de una semana | Se requiere un historial de objetivos. | Si el cálculo de compra usa el objetivo actualmente activo o el vigente al momento del inventario; cómo reproducir cálculos anteriores. |

Fuentes: [relación entre proveedores y productos](../src/db/schema/provider-products.ts),
[consultas de detalle de productos](../src/lib/queries/inventory-items.ts),
[visualización de stock y proveedores](../src/app/inventory/items/[id]/page.tsx).

## Aspectos por pulir verificados en el repositorio

1. Falta implementar las cantidades previstas, su historial y la garantía de un
   único objetivo activo. También faltan el cálculo de faltantes a comprar y la
   agrupación por proveedor.
2. La pantalla de historial todavía dice “Un inventario por día”, aunque sus
   tarjetas de fecha y el comportamiento de la base de datos son semanales. Este
   documento registra la discrepancia sin modificar la pantalla.
3. Las [notas anteriores de implementación del inventario](inventory.md) contienen
   descripciones ya reemplazadas sobre inventarios diarios y comparaciones de
   168 horas. Su último párrafo semanal reemplaza la regla diaria; las pantallas
   actuales de inventario usan instantáneas semanales.
4. El asistente informa campos sin revisar, pero no guarda un estado de completado,
   revisado o aprobado. Hay que definir qué significa operativamente “estado del
   inventario”.
5. Cocina puede contar y agregar productos al inventario; la gestión de asociaciones
   con proveedores pertenece a la aplicación principal, restringida a Admin.
   Siguen pendientes los permisos para editar objetivos y resolver proveedores.

Fuentes de acceso: [política de grupos](../src/lib/auth/policy.ts),
[autorización de cambios en inventario](../src/lib/actions/inventory.ts).

La verificación de este documento consiste en leer los esquemas, migraciones,
acciones, consultas y pantallas enlazadas, y comprobar las referencias locales
del Markdown. No confirma el contenido actual de producción ni su comportamiento
en ejecución.
