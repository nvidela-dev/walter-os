// ─────────────────────────────────────────────────────────────────────────────
// UI COPY — every Spanish string the app renders or returns lives here.
//
// Code stays English; this dictionary is the only place Spanish text appears
// (besides the physical DB identifiers in Drizzle schema files). If you ever
// add a second language, this file becomes the `es` message catalog as-is.
//
// Convention: nest by feature; use functions for interpolated strings.
// ─────────────────────────────────────────────────────────────────────────────

export const t = {
  access: {
    title: "Accesos", mainApp: "Inicio", email: "Correo electrónico", group: "Grupo",
    admin: "Administrador", kitchen: "Cocina", waitress: "Moza · Solo inventario de bebidas", none: "Sin acceso", save: "Guardar acceso",
    saved: "Acceso actualizado", selfProtection: "No podés quitarte tu propio acceso de administrador.",
    description: "Administradores: acceso a toda la aplicación. Cocina: solo inventario. Sin grupo: sin acceso.",
    hint: "Ingresá el correo que la persona usa para iniciar sesión. No se envían invitaciones automáticamente.",
    empty: "No hay usuarios con acceso.", checkAgain: "Ya solicité acceso · Volver a intentar",
  },
  inventory: {
    weeklyHistoryHint: "Un inventario por semana, de martes a lunes. Seleccioná una fecha para abrir su inventario y ver las cantidades y cambios frente al inventario anterior.",
    historyBack: "← Historial de inventarios",
    initialRun: "Inventario inicial",
    emptyRun: "Este inventario todavía no tiene conteos guardados.",
    runDetailHint: "Cantidades guardadas en este inventario. Los cambios comparan con el inventario anterior.",
    newInventory: "Nuevo inventario", newInventoryShort: "Nuevo",
    weeklyInventory: "Inventario semanal",
    weeklyListHint: "Conteos del inventario semanal, agrupados por heladera. Los cambios comparan con el inventario anterior.",
    compactProgress: (counted: number, total: number): string => `${counted}/${total} contados`,
    emptyFridge: "Sin productos", editFridge: "Editar heladera",
    weeklyStatus: "Estado del inventario semanal",
    weeklyNotStarted: "Todavía no se inició el inventario de esta semana.",
    weeklyStart: "Comenzar inventario semanal",
    weeklyEdit: "Editar inventario de la semana",
    fullyCounted: (total: number): string => `Todos los productos contados (${total}).`,
    countProgress: (counted: number, total: number): string => `${counted} de ${total} productos contados · ${total - counted} sin revisar`,
    latestRun: (date: string): string => `Inventario semanal: ${date}`,
    productTracked: "Este producto está registrado en inventario y no se puede eliminar.",
    alreadyLinked: "El producto ya está asociado a este proveedor.",
    title: "Inventario", fridges: "Heladeras", fridge: (number: number): string => `Heladera ${number}`,
    description: "Contá lo que hay ahora", number: "Número", name: "Nombre (opcional)",
    createFridge: "Agregar heladera", empty: "Todavía no hay heladeras.",
    search: "Buscar productos", searchAction: "Buscar", add: "Agregar", create: "Crear producto y agregar",
    productName: "Nombre del producto", unit: "Unidad", noProvider: "Proveedor no asignado",
    current: "Último conteo", now: "¿Cuánto hay ahora?", save: "Guardar inventario", saving: "Guardando…",
    saved: "Inventario guardado", noCount: "Sin conteos", noPrevious: "Sin inventario anterior",
    change: "Cambio vs. inventario anterior", unchanged: "Sin cambios",
    hint: "Completá solo lo que contaste. Dejá vacío lo que no revisaste. Cero significa que no queda nada.",
    online: "Se necesita conexión para consultar y guardar.", noItems: "Agregá productos para empezar a contar.",
    noMatches: "No se encontraron productos.", missing: "¿No existe en el catálogo?",
    denied: "No tenés acceso a esta sección.", invalidFridge: "La heladera no existe o está inactiva.",
    invalidItems: "Revisá los productos y las cantidades.", duplicateFridge: "Ese número de heladera ya existe.",
    unitChanged: "La unidad cambió: no se puede comparar.", comparedAt: "Comparado con",
    linkProduct: "Asociar producto existente", chooseProduct: "Seleccionar producto", linked: "Producto asociado",
    signOut: "Salir", tooMany: "Guardá hasta 200 productos por vez.",
  },
  inventoryTargets: {
    title: "Stock objetivo", scope: "Cantidad total que se busca mantener entre todas las heladeras.",
    quantity: (unit: string): string => `Cantidad objetivo (${unit})`,
    save: "Guardar objetivo", saved: "Objetivo guardado. El anterior queda en el historial.",
    missing: "Sin objetivo definido", adminOnly: "Un administrador puede definir o cambiar el objetivo.",
    history: "Historial de objetivos", historyHint: "Este historial registra cambios del plan, no conteos de stock. Solo hay un objetivo activo por producto.",
    active: "Activo", unitChanged: "La unidad del producto cambió. Definí un objetivo con la unidad actual antes de calcular compras.",
    back: "← Volver al producto", newer: "← Más recientes", older: "Más antiguos →",
  },
  inventoryPurchases: {
    title: "Compras por proveedor", back: "← Heladeras",
    hint: "Faltantes del último inventario frente al stock objetivo activo. Cada producto se suma entre todas sus heladeras.",
    unitsHint: "Las cantidades son unidades de stock. No se redondean a paquetes ni se convierten unidades automáticamente.",
    noInventory: "Todavía no hay un inventario. Registrá los conteos antes de preparar compras.",
    olderInventory: "El último inventario pertenece a una semana anterior. Revisá los conteos antes de usar estas cantidades.",
    noProducts: "No hay productos activos en inventario.",
    buy: (quantity: string, unit: string): string => `Comprar ${quantity} ${unit}`,
    comparison: (stock: string, target: string, unit: string): string => `Stock: ${stock} ${unit} · Objetivo: ${target} ${unit}`,
    supplierFor: (name: string): string => `Proveedor para ${name}`,
    chooseSupplier: "Elegí un proveedor", noSupplier: "Sin proveedor asociado. Un administrador puede asociarlo al producto.",
    unresolved: (count: number): string => `Pendientes de resolver (${count})`,
    unresolvedHint: "Estos productos no se incluyen en los grupos de compra hasta resolver sus datos.",
    noPurchase: (count: number): string => `Sin faltante a comprar (${count})`,
    selectionHint: "La elección de proveedor se aplica a esta vista. Al recargar, se vuelve a elegir; no se guarda un proveedor preferido ni se envían pedidos.",
    issues: { "missing-count": "Hay heladeras sin contar. No se asumió stock cero.", "missing-target": "Falta definir el stock objetivo.", "unit-mismatch": "Las unidades de los conteos, el objetivo o el producto no coinciden. Revisalos antes de calcular." },
  },
  /** App-level metadata (next/metadata, manifest). */
  app: {
    name: "Gestión",
    description: "Gestión para tu restaurante",
    keywords: ["restaurante", "gestión", "inventario", "recetas", "menú"],
    locale: "es",
  },

  /** Generic chrome reused everywhere. */
  common: {
    add: "Agregar",
    save: "Guardar",
    saveChanges: "Guardar Cambios",
    saved: "Guardado",
    saving: "Guardando...",
    cancel: "Cancelar",
    delete: "Eliminar",
    edit: "Editar",
    close: "Cerrar",
    back: "Volver",
    loading: "...",
  },

  /** Reusable delete-confirmation dialog. */
  deleteDialog: {
    title: "¿Eliminar?",
    confirm: (name: string) => `¿Estás seguro de que quieres eliminar "${name}"?`,
    trigger: (name: string) => `Eliminar ${name}`,
    failed: "No se pudo eliminar.",
  },

  /** Home dashboard tiles. */
  home: {
    sections: {
      expenses: {
        title: "Gastos",
        rawMaterials: "Materia Prima",
        people: "Personal",
      },
      kitchen: {
        title: "Cocina",
        kitchen: "Cocina",
      },
      outputs: {
        title: "Salidas",
        outputs: "Salidas",
      },
    },
    tiles: {
      dashboard: { name: "Panel", description: "Vista general" },
      providers: { name: "Proveedores", description: "Productos y precios" },
      invoices: { name: "Facturas", description: "Cargar y pagar" },
      employees: { name: "Equipo", description: "Personal y horas" },
      hours: { name: "Horas", description: "Registro de horas" },
      recipes: { name: "Recetas", description: "Tus recetas" },
      inventory: { name: "Inventario", description: "Control de stock" },
      menu: { name: "Menú", description: "Platos y precios" },
      cashOutputs: { name: "Salidas Caja", description: "Movimientos de caja" },
    },
  },

  providers: {
    title: "Proveedores",
    newTitle: "Nuevo Proveedor",
    create: "Crear Proveedor",
    addCta: "Agregar Proveedor",
    emptyTitle: "Sin proveedores",
    emptyTitleService: "Sin proveedores de servicios",
    emptyDescription: "Agrega tu primer proveedor",
    emptyDescriptionService: "Agrega tu primer proveedor de servicios",
    debtLabel: (amount: string) => `Deuda: $${amount}`,
    types: {
      producto: "Productos",
      servicio: "Servicios",
    },
    fields: {
      type: "Tipo",
      name: "Nombre del Proveedor",
      namePlaceholder: "Ingresa el nombre...",
      description: "Descripción",
      descriptionPlaceholder: "Descripción opcional...",
      visitDays: "Días de visita",
      currentDebt: "Deuda Actual ($)",
    },
    days: {
      L: "Lunes",
      M: "Martes",
      X: "Miércoles",
      J: "Jueves",
      V: "Viernes",
      S: "Sábado",
      D: "Domingo",
    },
  },

  products: {
    editTitle: "Editar Producto",
    addCta: "Agregar Producto",
    adding: "Agregando...",
    emptyHint: "Sin productos. Agrega uno abajo.",
    newTitle: "Nuevo producto",
    createAndUse: "Crear y usar",
    addHint: (providerName: string) => ({
      before: "Se agregará al catálogo de ",
      name: providerName,
      after: " y quedará disponible para futuras facturas.",
    }),
    fields: {
      name: "Nombre",
      namePlaceholder: "Nombre del producto",
      unit: "Unidad",
      price: "Precio ($)",
      pricePlaceholder: "Precio",
      quantityPlaceholder: "Cant.",
      packQuantity: "Cantidad por pack",
    },
  },

  invoices: {
    title: "Facturas",
    addShort: "Nueva",
    newTitle: "Nueva Factura",
    create: "Crear Factura",
    emptyTitle: "Sin facturas",
    emptyDescription: "Carga tu primera factura",
    noProvidersTitle: "No hay proveedores.",
    noProvidersHint: "Agrega un proveedor para empezar a registrar facturas.",
    goToProviders: "Ir a Proveedores",
    addProductOption: "+ Agregar producto nuevo…",
    fields: {
      type: "Tipo",
      provider: "Proveedor",
      providerPlaceholder: "Selecciona un proveedor",
      noProvidersOfProduct: "No hay proveedores de productos",
      noProvidersOfService: "No hay proveedores de servicios",
      date: "Fecha",
      number: "Nº de factura (opcional)",
      numberPlaceholder: "0001-00012345",
      notes: "Notas (opcional)",
      amount: "Monto",
      amountPrompt: "Cuánto salió",
      product: "Producto",
      productPlaceholder: "Selecciona un producto",
      pickProviderFirst: "Elige un proveedor primero",
      quantity: "Cantidad",
      unit: "Unidad",
      unitPrice: "Precio unit.",
      unitPriceFull: "Precio unitario",
      total: "Total",
    },
    lines: {
      heading: "Líneas",
      count: (n: number) => `${n} ${n === 1 ? "línea" : "líneas"}`,
      add: "Agregar línea",
      remove: "Quitar línea",
      subtotal: (amount: string) => `Subtotal: $${amount}`,
      newPrice: (previous: string) => `Nuevo precio (antes $${previous})`,
    },
    editProduct: {
      title: "Editar producto",
      hint: "Los cambios se guardan inmediatamente y afectan esta factura y los valores por defecto del producto.",
    },
    list: {
      filters: { all: "Todas", unpaid: "Pendientes", overdue: "Vencidas", paid: "Pagadas" },
      empty: "Sin facturas.",
      emptyPaid: "No hay facturas pagadas.",
      emptyUnpaid: "No hay facturas pendientes.",
      emptyOverdue: "No hay facturas vencidas.",
      markPaid: "Marcar como pagada",
      markUnpaid: "Marcar como pendiente",
      toggleFailed: "No se pudo actualizar la factura.",
      overdueBadge: "Vencida",
      delete: "Eliminar factura",
      deleteFailed: "No se pudo eliminar la factura.",
      pay: "Pagar",
      paidLabel: "Pagada",
      createCta: "Nueva factura",
      payConfirmTitle: "Confirmar pago",
      payConfirmHint: "Revisá los datos antes de marcar la factura como pagada.",
      payConfirmAction: "Confirmar",
    },
    errors: {
      selectProvider: "Selecciona un proveedor.",
      invalidAmount: "Monto inválido.",
      lineNeedsProduct: "Cada línea debe tener un producto.",
      invalidPriceFor: (product: string) => `Precio inválido en "${product}".`,
      invalidQuantityFor: (product: string) => `Cantidad inválida en "${product}".`,
      invalidPrice: "Precio inválido.",
      invalidQuantity: "Cantidad inválida.",
      selectUnit: "Selecciona una unidad.",
      nameRequired: "El nombre es obligatorio.",
      createFailed: "Error al crear la factura.",
      saveFailed: "Error al guardar.",
      productCreateFailed: "Error al crear el producto.",
    },
  },

  employees: {
    title: "Equipo",
    newTitle: "Nuevo Miembro",
    addCta: "Agregar Miembro",
    emptyTitle: "Sin empleados",
    emptyDescription: "Agrega a los miembros del equipo",
    rateSummary: (hourlyRate: string, extraHourRate: string) =>
      `Normal $${hourlyRate}/h · extra $${extraHourRate}/h`,
    weeklyEstimate: (amount: string) => `Est. $${amount}/sem`,
    monthlyEstimate: (amount: string) => `Est. $${amount}/mes`,
    estimateLabels: {
      weekly: "Semanal",
      monthly: "Mensual",
      fourHours: "4 h",
      eightHours: "8 h",
      extra: "Horas extra",
    },
    fields: {
      name: "Nombre",
      hourlyRate: "Tarifa por hora ($)",
      extraHourRate: "Tarifa hora extra ($)",
      weeklyHours: "Horas fijas semanales",
    },
  },

  recipes: {
    title: "Recetas",
    newTitle: "Nueva Receta",
    addCta: "Agregar Receta",
    emptyTitle: "Sin recetas",
    emptyDescription: "Agrega tus recetas aquí",
    ingredients: "Ingredientes",
    noIngredients: "Sin ingredientes aún.",
    fields: {
      name: "Nombre de la Receta",
      instructions: "Instrucciones",
      instructionsPlaceholder: "Cómo preparar...",
    },
  },

  menu: {
    title: "Menú",
    newTitle: "Nuevo Plato",
    addCta: "Agregar Plato",
    emptyTitle: "Sin platos",
    emptyDescription: "Agrega los platos del menú",
    fields: {
      name: "Nombre del Plato",
      sellPrice: "Precio de Venta ($)",
      recipe: "Receta Asociada",
      noRecipe: "Sin receta",
      description: "Descripción",
      descriptionPlaceholder: "Notas opcionales...",
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Server-side user-facing copy (returned by server actions / lib helpers).
  // ───────────────────────────────────────────────────────────────────────────

  /** Generic + per-entity action error messages. */
  errors: {
    generic: "No se pudo completar la acción.",
    invalidInput: "Revisá los datos ingresados.",
    provider: {
      createFailed: "No se pudo crear el proveedor.",
      notFound: "Proveedor no encontrado.",
      onlyProductProviders: "Solo se pueden agregar productos a proveedores de productos.",
      deleteBlocked:
        "No se puede eliminar este proveedor porque ya tiene productos, facturas o historial asociado.",
    },
    product: {
      notFound: "Producto no encontrado.",
      notFoundForProvider: "Producto no encontrado para este proveedor.",
      selectValidUnit: "Seleccioná una unidad válida.",
      deleteBlocked:
        "No se puede eliminar este producto porque ya tiene facturas, recetas o historial asociado.",
    },
    invoice: {
      notFound: "Factura no encontrada.",
      serviceNeedsServiceProvider:
        "Las facturas de servicio requieren un proveedor de servicios.",
      productNeedsProductProvider:
        "Las facturas de productos requieren un proveedor de productos.",
      lineProductNotForProvider:
        "La factura incluye un producto que no pertenece a este proveedor.",
      needsAtLeastOneLine: "Agregá al menos una línea.",
      deleteBlocked: "No se puede eliminar esta factura porque tiene líneas o historial asociado.",
    },
    employee: {
      createFailed: "No se pudo registrar al empleado.",
      notFound: "Empleado no encontrado.",
      deleteBlocked: "No se puede eliminar este empleado porque tiene horas extra registradas.",
    },
    recipe: {
      createFailed: "No se pudo crear la receta.",
      notFound: "Receta no encontrada.",
    },
    menu: {
      createFailed: "No se pudo crear el plato.",
      notFound: "Plato no encontrado.",
    },
  },

  /** Access control — shown when a signed-in email is not on the allowlist. */
  auth: {
    deniedTitle: "Solicitá acceso",
    deniedBody: "Tu cuenta todavía no tiene un grupo asignado. Pedile a un administrador que te agregue a Administrador o Cocina usando el correo con el que iniciás sesión.",
    signOut: "Cerrar sesión",
  },

  /** Zod validation messages. */
  validation: {
    invalidId: "Identificador inválido.",
    requiredField: "Este campo es obligatorio.",
    textTooLong: "El texto es demasiado largo.",
    invalidDate: "La fecha debe tener formato AAAA-MM-DD.",
    decimalScale: (scale: number) => `Usá hasta ${scale} decimales.`,
    mustBePositive: "El valor debe ser mayor que cero.",
    mustBeNonNegative: "El valor no puede ser negativo.",
    invalidVisitDay: "Día de visita inválido.",
    weeklyHoursInteger: "Las horas semanales deben ser un número entero.",
    weeklyHoursPositive: "Las horas semanales deben ser mayores que cero.",
    extraHoursInteger: "Las horas extra deben ser un número entero.",
    extraHoursPositive: "Las horas extra deben ser mayores que cero.",
  },
} as const;
