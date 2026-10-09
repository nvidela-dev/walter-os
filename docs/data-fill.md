# Relleno de Datos

La última sección de Inicio abre «¿Quién lo trae?». Está disponible para el grupo Admin, como el resto de Inicio.

En cada visita se mezclan los productos del catálogo que todavía no tienen ningún proveedor. Se muestra uno por vez con su unidad. La persona elige un proveedor de productos y toca «Guardar y seguir». El contador avanza y aparece una confirmación solo después de guardar. «No sé, pasar» conserva el producto pendiente y lo deja al final de la cola. El progreso mostrado corresponde a esa visita.

Se reutilizan los productos existentes y la relación proveedor_productos. La migración 0019 permite un precio desconocido (NULL); no se inventa un precio ni se agrega un registro al historial de precios. Los precios conocidos siguen siendo positivos. Los proveedores muestran «Precio pendiente» y las facturas permiten ingresar el precio real después.

Aplicar la migración antes de habilitar la versión nueva. No se aplicó a producción durante esta implementación. El flujo necesita conexión para guardar.

Validación: migraciones y guardado real en PGlite aislado; permisos, rechazo de proveedores de servicios, conservación de precios, cola tras guardar, salto y recuperación de errores en tests. Vista visual con datos de ejemplo; el navegador local requirió iniciar sesión, por lo que la sesión autenticada no se comprobó en navegador.
