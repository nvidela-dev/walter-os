"use client";

import { PencilSquareIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { type ReactElement, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import type { z } from "zod";

import { createProductForProvider, updateProduct } from "@/app/providers/actions";
import { FieldError, FormMessage } from "@/components/form-feedback";
import type { ProveedorTipo } from "@/db/schema";

import { createFactura } from "../actions";
import {
  editProductModalSchema,
  type EditProductModalValues,
  facturaFormSchema,
  type FacturaFormValues,
  newProductModalSchema,
  type NewProductModalValues,
} from "../schema";

const NEW_PRODUCT_VALUE = "__new__";

interface UnidadOption {
  id: string;
  codigo: string;
  nombre: string;
}

interface FormProducto {
  id: string;
  nombre: string;
  unidadId: string;
  unidadCodigo: string;
  precioActual: string;
}

interface FormProveedor {
  id: string;
  nombre: string;
  tipo: ProveedorTipo;
  productos: FormProducto[];
}

const emptyLinea = (): FacturaFormValues["lineas"][number] => ({
  productoId: "",
  cantidad: "1",
  precioUnit: "",
});

const todayLocal = (): string => {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
};

const numericInputClass =
  "w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-3 py-3 text-sm text-[#3d3530] focus:border-[#c4a77d] focus:outline-none";

export function FacturaForm({
  proveedores,
  unidades,
}: {
  proveedores: FormProveedor[];
  unidades: UnidadOption[];
}): ReactElement {
  const router = useRouter();
  const [editingLineIdx, setEditingLineIdx] = useState<number | null>(null);
  const [creatingLineIdx, setCreatingLineIdx] = useState<number | null>(null);
  // Products created during this session, keyed by provider, so they appear in
  // dropdowns immediately without waiting for router.refresh().
  const [newProductsByProveedor, setNewProductsByProveedor] = useState<
    Record<string, FormProducto[]>
  >({});

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<FacturaFormValues, unknown, z.output<typeof facturaFormSchema>>({
    resolver: zodResolver(facturaFormSchema),
    defaultValues: {
      tipo: "producto",
      proveedorId: "",
      fecha: todayLocal(),
      numero: "",
      notas: "",
      monto: "",
      lineas: [emptyLinea()],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({ control, name: "lineas" });

  const tipo = useWatch({ control, name: "tipo" });
  const proveedorId = useWatch({ control, name: "proveedorId" });
  const monto = useWatch({ control, name: "monto" });
  const watchedLineas = useWatch({ control, name: "lineas" });

  const visibleProveedores = proveedores.filter((p) => p.tipo === tipo);
  const proveedor = visibleProveedores.find((p) => p.id === proveedorId);

  const baseProductos = proveedor?.productos ?? [];
  const extraProductos = proveedor ? (newProductsByProveedor[proveedor.id] ?? []) : [];
  const seenIds = new Set(baseProductos.map((p) => p.id));
  const productos =
    extraProductos.length === 0
      ? baseProductos
      : [...baseProductos, ...extraProductos.filter((p) => !seenIds.has(p.id))].sort((a, b) =>
          a.nombre.localeCompare(b.nombre)
        );
  const productoById = new Map(productos.map((p) => [p.id, p]));

  const lineasTotal = watchedLineas.reduce(
    (sum, l) => sum + Number(l.precioUnit || 0) * Number(l.cantidad || 0),
    0
  );
  const total = tipo === "servicio" ? Number(monto || 0) : lineasTotal;

  function changeTipo(next: ProveedorTipo): void {
    if (next === tipo) return;
    setValue("tipo", next);
    setValue("proveedorId", "");
    setValue("monto", "");
    replace([emptyLinea()]);
    clearErrors();
  }

  function changeProveedor(id: string): void {
    setValue("proveedorId", id);
    replace([emptyLinea()]);
  }

  function selectProducto(idx: number, value: string): void {
    if (value === NEW_PRODUCT_VALUE) {
      setCreatingLineIdx(idx);
      return;
    }
    const producto = productoById.get(value);
    setValue(`lineas.${idx}.productoId`, value);
    setValue(`lineas.${idx}.precioUnit`, producto?.precioActual ?? "");
  }

  function handleProductCreated(idx: number, producto: FormProducto): void {
    if (!proveedor) return;
    setNewProductsByProveedor((prev) => {
      const existing = prev[proveedor.id] ?? [];
      if (existing.some((p) => p.id === producto.id)) return prev;
      return { ...prev, [proveedor.id]: [...existing, producto] };
    });
    setValue(`lineas.${idx}.productoId`, producto.id);
    setValue(`lineas.${idx}.precioUnit`, producto.precioActual);
    setCreatingLineIdx(null);
    router.refresh();
  }

  const submit = handleSubmit(async (data) => {
    const result = await createFactura(
      data.tipo === "servicio"
        ? {
            proveedorId: data.proveedorId,
            fecha: data.fecha,
            numero: data.numero,
            notas: data.notas,
            monto: data.monto,
          }
        : {
            proveedorId: data.proveedorId,
            fecha: data.fecha,
            numero: data.numero,
            notas: data.notas,
            lineas: data.lineas,
          }
    );
    if (result.ok) {
      router.push("/");
    } else {
      setError("root", { message: result.error });
    }
  });

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-4">
      <section className="space-y-4 rounded-2xl bg-[#f5f0e8] p-6">
        <div>
          <label className="mb-2 block text-xs font-medium text-[#8b7355]">Tipo</label>
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-1">
            <button
              type="button"
              onClick={() => {
                changeTipo("producto");
              }}
              className={`rounded-xl py-2.5 text-center text-sm font-medium transition-colors ${
                tipo === "producto"
                  ? "bg-[#c4a77d] text-white shadow-sm"
                  : "text-[#8b7355] hover:bg-[#f5f0e8]"
              }`}
            >
              Productos
            </button>
            <button
              type="button"
              onClick={() => {
                changeTipo("servicio");
              }}
              className={`rounded-xl py-2.5 text-center text-sm font-medium transition-colors ${
                tipo === "servicio"
                  ? "bg-[#c4a77d] text-white shadow-sm"
                  : "text-[#8b7355] hover:bg-[#f5f0e8]"
              }`}
            >
              Servicios
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="proveedor" className="mb-2 block text-xs font-medium text-[#8b7355]">
            Proveedor
          </label>
          <select
            id="proveedor"
            value={proveedorId}
            onChange={(e) => {
              changeProveedor(e.target.value);
            }}
            className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#3d3530] focus:border-[#c4a77d] focus:outline-none"
          >
            <option value="">
              {visibleProveedores.length === 0
                ? tipo === "servicio"
                  ? "No hay proveedores de servicios"
                  : "No hay proveedores de productos"
                : "Selecciona un proveedor"}
            </option>
            {visibleProveedores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
          <FieldError message={errors.proveedorId?.message} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="fecha" className="mb-2 block text-xs font-medium text-[#8b7355]">
              Fecha
            </label>
            <input type="date" id="fecha" {...register("fecha")} className={numericInputClass} />
            <FieldError message={errors.fecha?.message} />
          </div>
          <div>
            <label htmlFor="numero" className="mb-2 block text-xs font-medium text-[#8b7355]">
              Nº de factura (opcional)
            </label>
            <input
              type="text"
              id="numero"
              placeholder="0001-00012345"
              {...register("numero")}
              className={numericInputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="notas" className="mb-2 block text-xs font-medium text-[#8b7355]">
            Notas (opcional)
          </label>
          <textarea id="notas" rows={2} {...register("notas")} className={numericInputClass} />
        </div>
      </section>

      {tipo === "servicio" && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-medium text-[#8b7355]">Monto</h2>
          </div>
          <div className="rounded-xl bg-white p-4">
            <label htmlFor="monto" className="mb-2 block text-xs font-medium text-[#8b7355]">
              Cuánto salió
            </label>
            <input
              id="monto"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              disabled={!proveedor}
              {...register("monto")}
              className={numericInputClass}
            />
            <FieldError message={errors.monto?.message} />
          </div>
        </section>
      )}

      {tipo === "producto" && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-medium text-[#8b7355]">Líneas</h2>
            <span className="text-xs text-[#c4a77d]">
              {fields.length} {fields.length === 1 ? "línea" : "líneas"}
            </span>
          </div>

          {fields.map((field, idx) => {
            const linea = watchedLineas[idx];
            const producto =
              linea?.productoId != null ? productoById.get(linea.productoId) : undefined;
            const precioUnit = linea?.precioUnit ?? "";
            const cantidad = linea?.cantidad ?? "";
            const isNewPrice =
              producto !== undefined &&
              precioUnit !== "" &&
              Number(precioUnit) !== Number(producto.precioActual);
            const lineTotal = Number(precioUnit || 0) * Number(cantidad || 0);

            return (
              <div key={field.id} className="space-y-3 rounded-xl bg-white p-4">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <label className="mb-2 block text-xs font-medium text-[#8b7355]">Producto</label>
                    <select
                      disabled={!proveedor}
                      value={linea?.productoId ?? ""}
                      onChange={(e) => {
                        selectProducto(idx, e.target.value);
                      }}
                      className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-3 py-3 text-sm text-[#3d3530] focus:border-[#c4a77d] focus:outline-none disabled:bg-[#faf8f5] disabled:text-[#c4a77d]"
                    >
                      <option value="">
                        {proveedor ? "Selecciona un producto" : "Elige un proveedor primero"}
                      </option>
                      {productos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre}
                        </option>
                      ))}
                      {proveedor && (
                        <option value={NEW_PRODUCT_VALUE}>+ Agregar producto nuevo…</option>
                      )}
                    </select>
                    <FieldError message={errors.lineas?.[idx]?.productoId?.message} />
                  </div>
                  <div className="mt-7 flex gap-2">
                    {producto && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingLineIdx(idx);
                        }}
                        aria-label="Editar producto"
                        title="Editar producto"
                        className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f5f0e8] text-[#8b7355] hover:bg-[#e8e0d4]"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                    )}
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          remove(idx);
                        }}
                        aria-label="Quitar línea"
                        className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f5f0e8] text-[#8b7355] hover:bg-[#e8e0d4]"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-[#8b7355]">Cantidad</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      {...register(`lineas.${idx}.cantidad`)}
                      className={numericInputClass}
                    />
                    <FieldError message={errors.lineas?.[idx]?.cantidad?.message} />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-medium text-[#8b7355]">Unidad</label>
                    <input
                      type="text"
                      readOnly
                      value={producto?.unidadCodigo ?? "—"}
                      className="w-full rounded-xl border-2 border-[#e8e0d4] bg-[#faf8f5] px-3 py-3 text-sm text-[#8b7355]"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-medium text-[#8b7355]">
                      Precio unit.
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      disabled={!producto}
                      {...register(`lineas.${idx}.precioUnit`)}
                      className={numericInputClass}
                    />
                    <FieldError message={errors.lineas?.[idx]?.precioUnit?.message} />
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[#f5f0e8] pt-3 text-sm">
                  <div className="text-[#8b7355]">
                    {isNewPrice && (
                      <span className="text-amber-700">
                        Nuevo precio (antes ${producto.precioActual})
                      </span>
                    )}
                  </div>
                  <div className="font-medium text-[#3d3530]">Subtotal: ${lineTotal.toFixed(2)}</div>
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => {
              append(emptyLinea());
            }}
            disabled={!proveedor}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#c4a77d] py-3 text-sm font-medium text-[#c4a77d] hover:bg-white disabled:opacity-40"
          >
            <PlusIcon className="h-4 w-4" />
            Agregar línea
          </button>
        </section>
      )}

      <section className="rounded-2xl bg-[#f5f0e8] p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-[#8b7355]">Total</span>
          <span className="text-2xl font-light text-[#3d3530]">${total.toFixed(2)}</span>
        </div>

        <FormMessage message={errors.root?.message ?? null} className="mb-3" />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-[#c4a77d] py-4 text-base font-medium text-white shadow-sm active:scale-[0.99] disabled:opacity-50"
        >
          {isSubmitting ? "Guardando..." : "Crear Factura"}
        </button>
      </section>

      {editingLineIdx !== null &&
        proveedor &&
        ((): ReactElement | null => {
          const linea = watchedLineas[editingLineIdx];
          if (linea == null) return null;
          const producto = productoById.get(linea.productoId);
          if (!producto) return null;
          return (
            <EditProductModal
              proveedorId={proveedor.id}
              producto={producto}
              unidades={unidades}
              initialPrecio={linea.precioUnit || producto.precioActual}
              onClose={() => {
                setEditingLineIdx(null);
              }}
              onSaved={(newPrecio) => {
                setValue(`lineas.${editingLineIdx}.precioUnit`, newPrecio);
                setEditingLineIdx(null);
                router.refresh();
              }}
            />
          );
        })()}

      {creatingLineIdx !== null && proveedor && (
        <AddProductModal
          proveedorId={proveedor.id}
          proveedorNombre={proveedor.nombre}
          unidades={unidades}
          onClose={() => {
            setCreatingLineIdx(null);
          }}
          onCreated={(producto) => {
            handleProductCreated(creatingLineIdx, producto);
          }}
        />
      )}
    </form>
  );
}

function EditProductModal({
  proveedorId,
  producto,
  unidades,
  initialPrecio,
  onClose,
  onSaved,
}: {
  proveedorId: string;
  producto: FormProducto;
  unidades: UnidadOption[];
  initialPrecio: string;
  onClose: () => void;
  onSaved: (newPrecio: string) => void;
}): ReactElement {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EditProductModalValues, unknown, z.output<typeof editProductModalSchema>>({
    resolver: zodResolver(editProductModalSchema),
    defaultValues: { unidadId: producto.unidadId, precio: initialPrecio },
  });

  const submit = handleSubmit(async (data) => {
    const result = await updateProduct(proveedorId, producto.id, {
      nombre: producto.nombre,
      unidadId: data.unidadId,
      precio: data.precio,
    });
    if (result.ok) {
      onSaved(data.precio);
    } else {
      setError("root", { message: result.error });
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <form
        onSubmit={(e) => void submit(e)}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium text-[#3d3530]">Editar producto</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Cerrar"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5f0e8] text-[#8b7355] hover:bg-[#e8e0d4]"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-[#8b7355]">
          Los cambios se guardan inmediatamente y afectan esta factura y los valores por defecto del
          producto.
        </p>

        <div className="mb-4">
          <p className="mb-2 text-xs font-medium text-[#8b7355]">Producto</p>
          <p className="rounded-xl bg-[#faf8f5] px-4 py-3 text-sm text-[#3d3530]">{producto.nombre}</p>
        </div>

        <div className="mb-4">
          <label htmlFor="modal-unidad" className="mb-2 block text-xs font-medium text-[#8b7355]">
            Unidad
          </label>
          <select
            id="modal-unidad"
            disabled={isSubmitting}
            {...register("unidadId")}
            className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#3d3530] focus:border-[#c4a77d] focus:outline-none"
          >
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </select>
          <FieldError message={errors.unidadId?.message} />
        </div>

        <div className="mb-6">
          <label htmlFor="modal-precio" className="mb-2 block text-xs font-medium text-[#8b7355]">
            Precio unitario
          </label>
          <input
            id="modal-precio"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            disabled={isSubmitting}
            {...register("precio")}
            className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#3d3530] focus:border-[#c4a77d] focus:outline-none"
          />
          <FieldError message={errors.precio?.message} />
        </div>

        <FormMessage message={errors.root?.message ?? null} className="mb-3" />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 rounded-xl border-2 border-[#e8e0d4] py-3 text-sm font-medium text-[#8b7355]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 rounded-xl bg-[#c4a77d] py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {isSubmitting ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}

function AddProductModal({
  proveedorId,
  proveedorNombre,
  unidades,
  onClose,
  onCreated,
}: {
  proveedorId: string;
  proveedorNombre: string;
  unidades: UnidadOption[];
  onClose: () => void;
  onCreated: (producto: FormProducto) => void;
}): ReactElement {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<NewProductModalValues, unknown, z.output<typeof newProductModalSchema>>({
    resolver: zodResolver(newProductModalSchema),
    defaultValues: { nombre: "", unidadId: unidades[0]?.id ?? "", precio: "", cantidad: "1" },
  });

  const submit = handleSubmit(async (data) => {
    const result = await createProductForProvider(
      proveedorId,
      { nombre: data.nombre, descripcion: null, unidadId: data.unidadId },
      data.precio,
      data.cantidad
    );
    if (result.ok) {
      const unidad = unidades.find((u) => u.id === data.unidadId);
      onCreated({
        id: result.data.id,
        nombre: result.data.nombre,
        unidadId: data.unidadId,
        unidadCodigo: unidad?.codigo ?? "",
        precioActual: data.precio,
      });
    } else {
      setError("root", { message: result.error });
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <form
        onSubmit={(e) => void submit(e)}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium text-[#3d3530]">Nuevo producto</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Cerrar"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5f0e8] text-[#8b7355] hover:bg-[#e8e0d4]"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-[#8b7355]">
          Se agregará al catálogo de{" "}
          <span className="font-medium text-[#3d3530]">{proveedorNombre}</span> y quedará disponible
          para futuras facturas.
        </p>

        <div className="mb-4">
          <label htmlFor="new-prod-nombre" className="mb-2 block text-xs font-medium text-[#8b7355]">
            Nombre
          </label>
          <input
            id="new-prod-nombre"
            type="text"
            disabled={isSubmitting}
            {...register("nombre")}
            className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#3d3530] focus:border-[#c4a77d] focus:outline-none"
          />
          <FieldError message={errors.nombre?.message} />
        </div>

        <div className="mb-4">
          <label htmlFor="new-prod-unidad" className="mb-2 block text-xs font-medium text-[#8b7355]">
            Unidad
          </label>
          <select
            id="new-prod-unidad"
            disabled={isSubmitting}
            {...register("unidadId")}
            className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#3d3530] focus:border-[#c4a77d] focus:outline-none"
          >
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </select>
          <FieldError message={errors.unidadId?.message} />
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="new-prod-precio" className="mb-2 block text-xs font-medium text-[#8b7355]">
              Precio unit.
            </label>
            <input
              id="new-prod-precio"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              disabled={isSubmitting}
              {...register("precio")}
              className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#3d3530] focus:border-[#c4a77d] focus:outline-none"
            />
            <FieldError message={errors.precio?.message} />
          </div>
          <div>
            <label
              htmlFor="new-prod-cantidad"
              className="mb-2 block text-xs font-medium text-[#8b7355]"
            >
              Cantidad por pack
            </label>
            <input
              id="new-prod-cantidad"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              disabled={isSubmitting}
              {...register("cantidad")}
              className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#3d3530] focus:border-[#c4a77d] focus:outline-none"
            />
            <FieldError message={errors.cantidad?.message} />
          </div>
        </div>

        <FormMessage message={errors.root?.message ?? null} className="mb-3" />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 rounded-xl border-2 border-[#e8e0d4] py-3 text-sm font-medium text-[#8b7355]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 rounded-xl bg-[#c4a77d] py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {isSubmitting ? "Guardando..." : "Crear y usar"}
          </button>
        </div>
      </form>
    </div>
  );
}
