# Plan de Inventario

La sección «Plan de Inventario» de Inicio permite definir cuánto debería haber de cada producto de las heladeras activas. Los productos se agrupan por número y nombre de heladera. Si un producto está en varias heladeras, aparece en cada grupo y se indica que su objetivo es compartido: el total entre todas las heladeras. El contador general cuenta cada producto una sola vez.

Se puede buscar por nombre, mostrar solo productos sin planificar y guardar cada cantidad por separado. Vacío significa pendiente; cero es un objetivo explícito. Si cambia la unidad del producto, se muestra el objetivo anterior y se pide confirmar uno en la nueva unidad.

El plan reutiliza los objetivos y su historial existentes. Los cambios quedan disponibles en el detalle del producto y en la comparación de compras. No modifica los conteos de inventario. Solo Admin puede consultar esta pantalla y guardar objetivos.

No requiere una nueva migración. Verificado con pruebas de guardado, filtros, errores, permisos y productos en varias heladeras; vista visual con datos de ejemplo.
