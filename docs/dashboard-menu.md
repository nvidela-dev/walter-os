# Menú privado

`/dashboard` es un menú exclusivo de Admin con tres accesos: Dashboard (`/dashboard/providers`), Unir nombres (`/product-matching`) y Revisar duplicados (`/product-duplicates`). Usa las mismas tarjetas de vidrio del inicio.

El Dashboard anterior conserva su funcionamiento en `/dashboard/providers`. Los otros dos mantienen sus direcciones para conservar enlaces existentes. Los tres vuelven a `/dashboard`; el menú permite volver a Inicio. Los accesos a Unir nombres y Revisar duplicados se retiraron del inicio habitual y no se agregó allí un acceso al menú privado.

El menú y el Dashboard requieren autorización de Admin en el servidor; las herramientas mantienen sus propias comprobaciones. Kitchen y Waitress no tienen acceso. Ocultar el acceso no reemplaza esos permisos. No requiere migración ni modifica datos.
