// ─────────────────────────────────────────────────────────────────────────────
// UI COPY — every Spanish string the app renders or returns lives here.
//
// Code stays English; this dictionary is the only place Spanish text appears
// (besides the physical DB identifiers documented in glossary.ts). If you ever
// add a second language, this file becomes the `es` message catalog as-is.
//
// Convention: nest by feature; use functions for interpolated strings.
// ─────────────────────────────────────────────────────────────────────────────

export const t = {
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
    tiles: {
      providers: { name: "Proveedores", description: "Productos y precios" },
      invoices: { name: "Facturas", description: "Cargar y pagar" },
      employees: { name: "Equipo", description: "Personal y sueldos" },
      recipes: { name: "Recetas", description: "Tus recetas" },
      menu: { name: "Menú", description: "Platos y precios" },
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
      filters: { all: "Todas", unpaid: "Pendientes", paid: "Pagadas" },
      empty: "Sin facturas.",
      emptyPaid: "No hay facturas pagadas.",
      emptyUnpaid: "No hay facturas pendientes.",
      markPaid: "Marcar como pagada",
      markUnpaid: "Marcar como pendiente",
      toggleFailed: "No se pudo actualizar la factura.",
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
    monthlyPay: (amount: string) => `$${amount}/mes`,
    fields: {
      name: "Nombre",
      monthlySalary: "Salario Mensual ($)",
      weeklyHours: "Horas Semanales",
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
