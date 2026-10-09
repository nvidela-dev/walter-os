# Inventario de Bebidas

Admin abre «Bebidas» desde Inicio. En «Bebidas y objetivos» agrega una bebida, su unidad y la ubicación donde se cuenta (por ejemplo, heladera del bar o depósito). Si el producto ya existe con la misma unidad, se reutiliza. Un mismo producto puede estar en varias ubicaciones, con un conteo y objetivo independientes en cada una.

La moza abre directamente el inventario de bebidas al iniciar sesión. Puede ingresar conteos, corregirlos y consultar las semanas anteriores. No puede administrar bebidas, objetivos, usuarios, proveedores ni el inventario de cocina. Admin asigna el rol «Moza · Solo inventario de bebidas» en Accesos usando el correo de inicio de sesión. No se asignan cuentas automáticamente.

El inventario de bebidas usa una semana de martes a lunes en America/Montevideo. Vacío significa sin revisar; cero significa que se revisó y no queda nada. Cada guardado conserva una observación con su autor. La pantalla y el historial muestran la última corrección de cada semana; las observaciones anteriores no se pueden borrar ni modificar.

Los objetivos son por bebida y ubicación. Se muestran los faltantes solo si el conteo y el objetivo usan la unidad actual. Las cantidades no se convierten automáticamente entre unidades. Ocultar una bebida deja de mostrarla para contar y conserva su historial; Admin puede restaurarla.

La pantalla requiere conexión para consultar y guardar. Los permisos se validan en rutas, lecturas y acciones del servidor, además de ocultar los enlaces administrativos.

La migración 0020 agrega la membresía de mozas, ubicaciones de bebidas y sus observaciones. El paso de preparación de Vercel la aplica únicamente si no existen esas tres tablas, verifica sus triggers y rechaza instalaciones parciales. No modifica membresías existentes ni reproduce el registro de migraciones antiguo.

Validación: base PostgreSQL aislada con migraciones, separación de roles, guardado atómico, correcciones y semanas, preservación de nombres/unidades históricos, valores vacíos y cero, recuperación de errores y preparación de despliegue repetible. No se aplicó la migración a producción durante el desarrollo.
