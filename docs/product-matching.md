# Unir nombres

La app `/product-matching` compara los productos de heladeras activas con el catálogo de proveedores. Está disponible para Admin desde Inicio.

- **Sugerencias:** hipótesis preparadas al revisar los nombres reales del catálogo en octubre de 2026. Cada par explica la posible equivalencia. No se confirma automáticamente.
- **Automáticos:** mismo producto o mismo nombre al ignorar tildes, espacios, signos y mayúsculas. Estos vínculos se calculan al abrir la app; siguen pendientes de revisión y se pueden deshacer.
- **Sin sugerencia:** no hay un par razonable o se descartaron las propuestas. Usar **Buscar / cambiar** para buscar por nombre o proveedor en todo el catálogo.
- **Revisados:** productos con al menos una equivalencia confirmada. Se pueden agregar alternativas o deshacer vínculos.
- **Todos:** permite revisar cualquier producto, incluyendo otras sugerencias de un producto ya confirmado.

Los productos de igual nombre conservan sus identidades individuales. Varias alternativas pueden ser válidas: confirmar una no descarta las demás. Las decisiones se guardan por par, con usuario y fecha, y se comparten entre administradores. La última revisión guardada prevalece. Los descartes evitan que el mismo vínculo automático reaparezca; se pueden recuperar desde la búsqueda manual.

Estas equivalencias no fusionan productos, asignan proveedores, cambian precios o cantidades, ni convierten unidades. Tampoco identifican el proveedor del stock observado. Se guardan aparte en `equivalencias_productos`; las otras aplicaciones todavía no las usan.

Las hipótesis actuales fueron preparadas por Codex leyendo el catálogo; la aplicación no llama a un servicio de IA. Para nombres nuevos también ofrece coincidencias de palabras completas. Una variedad que no se puede inferir queda para búsqueda manual. Los nombres genéricos del catálogo, como «Varios», no justifican una equivalencia.

Validación: pruebas de normalización, variantes incompatibles, hipótesis, confirmación, rechazo persistido, deshacer, fallos de guardado y migración repetible. El bootstrap de Vercel instala la nueva tabla sin cambiar los productos históricos.
