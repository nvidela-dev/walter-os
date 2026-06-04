"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TrashIcon, PlusIcon, PencilSquareIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { createFactura } from "../actions";
import { createProductForProvider, updateProduct } from "@/app/providers/actions";
import { FormMessage } from "@/components/form-feedback";
import type { ProveedorTipo } from "@/db/schema";

const NEW_PRODUCT_VALUE = "__new__";

const TIPO_TABS: { value: ProveedorTipo; label: string }[] = [
  { value: "producto", label: "Productos" },
  { value: "servicio", label: "Servicios" },
];

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

interface LineaState {
  productoId: string;
  cantidad: string;
  precioUnit: string;
}

const emptyLinea = (): LineaState => ({ productoId: "", cantidad: "1", precioUnit: "" });

const todayLocal = () => {
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
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [tipo, setTipo] = useState<ProveedorTipo>("producto");
  const [proveedorId, setProveedorId] = useState("");
  const [fecha, setFecha] = useState(todayLocal);
  const [numero, setNumero] = useState("");
  const [notas, setNotas] = useState("");
  const [lineas, setLineas] = useState<LineaState[]>([emptyLinea()]);
  const [monto, setMonto] = useState("");
  const [editingLineIdx, setEditingLineIdx] = useState<number | null>(null);
  const [creatingLineIdx, setCreatingLineIdx] = useState<number | null>(null);
  // Holds products created during this session, keyed by provider, so they
  // appear in dropdowns immediately without waiting for router.refresh().
  const [newProductsByProveedor, setNewProductsByProveedor] = useState<
    Record<string, FormProducto[]>
  >({});

  const visibleProveedores = useMemo(
    () => proveedores.filter((p) => p.tipo === tipo),
    [proveedores, tipo]
  );
  const proveedor = visibleProveedores.find((p) => p.id === proveedorId);
  const productos = useMemo(() => {
    const base = proveedor?.productos ?? [];
    const extras = proveedor ? newProductsByProveedor[proveedor.id] ?? [] : [];
    if (extras.length === 0) return base;
    const seen = new Set(base.map((p) => p.id));
    return [...base, ...extras.filter((p) => !seen.has(p.id))].sort((a, b) =>
      a.nombre.localeCompare(b.nombre)
    );
  }, [proveedor, newProductsByProveedor]);
  const productoById = useMemo(() => {
    const map = new Map<string, FormProducto>();
    for (const p of productos) map.set(p.id, p);
    return map;
  }, [productos]);

  const lineasTotal = lineas.reduce(
    (sum, l) => sum + Number(l.precioUnit || 0) * Number(l.cantidad || 0),
    0
  );
  const total = tipo === "servicio" ? Number(monto || 0) : lineasTotal;

  function changeTipo(next: ProveedorTipo) {
    if (next === tipo) return;
    setTipo(next);
    setProveedorId("");
    setLineas([emptyLinea()]);
    setMonto("");
    setError(null);
  }

  function changeProveedor(id: string) {
    setProveedorId(id);
    setLineas([emptyLinea()]);
  }

  function updateLinea(idx: number, patch: Partial<LineaState>) {
    setLineas((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function selectProducto(idx: number, productoId: string) {
    if (productoId === NEW_PRODUCT_VALUE) {
      setCreatingLineIdx(idx);
      return;
    }
    const producto = productoById.get(productoId);
    updateLinea(idx, {
      productoId,
      precioUnit: producto?.precioActual ?? "",
    });
  }

  function handleProductCreated(idx: number, producto: FormProducto) {
    if (!proveedor) return;
    setNewProductsByProveedor((prev) => {
      const existing = prev[proveedor.id] ?? [];
      if (existing.some((p) => p.id === producto.id)) return prev;
      return { ...prev, [proveedor.id]: [...existing, producto] };
    });
    setLineas((prev) =>
      prev.map((l, i) =>
        i === idx ? { ...l, productoId: producto.id, precioUnit: producto.precioActual } : l
      )
    );
    setCreatingLineIdx(null);
    router.refresh();
  }

  function addLinea() {
    setLineas((prev) => [...prev, emptyLinea()]);
  }

  function removeLinea(idx: number) {
    setLineas((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!proveedorId) {
      setError("Selecciona un proveedor.");
      return;
    }

    if (tipo === "servicio") {
      const montoNum = Number(monto);
      if (!isFinite(montoNum) || montoNum <= 0) {
        setError("Monto inválido.");
        return;
      }
      startTransition(async () => {
        try {
          const result = await createFactura({
            proveedorId,
            fecha,
            numero: numero.trim() || null,
            notas: notas.trim() || null,
            monto,
          });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          router.push("/");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Error al crear la factura.");
        }
      });
      return;
    }

    const payloadLineas: Array<{
      productoId: string;
      unidadId: string;
      precioUnit: string;
      cantidad: string;
    }> = [];
    for (const l of lineas) {
      const producto = productoById.get(l.productoId);
      if (!producto) {
        setError("Cada línea debe tener un producto.");
        return;
      }
      const precio = Number(l.precioUnit);
      const cant = Number(l.cantidad);
      if (!isFinite(precio) || precio <= 0) {
        setError(`Precio inválido en "${producto.nombre}".`);
        return;
      }
      if (!isFinite(cant) || cant <= 0) {
        setError(`Cantidad inválida en "${producto.nombre}".`);
        return;
      }
      payloadLineas.push({
        productoId: producto.id,
        unidadId: producto.unidadId,
        precioUnit: l.precioUnit,
        cantidad: l.cantidad,
      });
    }

    startTransition(async () => {
      try {
        const result = await createFactura({
          proveedorId,
          fecha,
          numero: numero.trim() || null,
          notas: notas.trim() || null,
          lineas: payloadLineas,
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.push("/");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al crear la factura.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <section className="space-y-4 rounded-2xl bg-[#f5f0e8] p-6">
        <div>
          <label className="mb-2 block text-xs font-medium text-[#8b7355]">Tipo</label>
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-1">
            {TIPO_TABS.map((tab) => {
              const isActive = tab.value === tipo;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => changeTipo(tab.value)}
                  className={`rounded-xl py-2.5 text-center text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#c4a77d] text-white shadow-sm"
                      : "text-[#8b7355] hover:bg-[#f5f0e8]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="proveedor" className="mb-2 block text-xs font-medium text-[#8b7355]">
            Proveedor
          </label>
          <select
            id="proveedor"
            required
            value={proveedorId}
            onChange={(e) => changeProveedor(e.target.value)}
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
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="fecha" className="mb-2 block text-xs font-medium text-[#8b7355]">
              Fecha
            </label>
            <input
              type="date"
              id="fecha"
              required
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-3 py-3 text-sm text-[#3d3530] focus:border-[#c4a77d] focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="numero" className="mb-2 block text-xs font-medium text-[#8b7355]">
              Nº de factura (opcional)
            </label>
            <input
              type="text"
              id="numero"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="0001-00012345"
              className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-3 py-3 text-sm text-[#3d3530] placeholder:text-[#c4a77d] focus:border-[#c4a77d] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="notas" className="mb-2 block text-xs font-medium text-[#8b7355]">
            Notas (opcional)
          </label>
          <textarea
            id="notas"
            rows={2}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-3 py-3 text-sm text-[#3d3530] focus:border-[#c4a77d] focus:outline-none"
          />
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
              required
              disabled={!proveedor}
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className={numericInputClass}
            />
          </div>
        </section>
      )}

      {tipo === "producto" && (
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-medium text-[#8b7355]">Líneas</h2>
          <span className="text-xs text-[#c4a77d]">
            {lineas.length} {lineas.length === 1 ? "línea" : "líneas"}
          </span>
        </div>

        {lineas.map((linea, idx) => {
          const producto = productoById.get(linea.productoId);
          const isNewPrice =
            !!producto &&
            !!linea.precioUnit &&
            Number(linea.precioUnit) !== Number(producto.precioActual);
          const lineTotal =
            Number(linea.precioUnit || 0) * Number(linea.cantidad || 0);

          return (
            <div key={idx} className="space-y-3 rounded-xl bg-white p-4">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <label className="mb-2 block text-xs font-medium text-[#8b7355]">
                    Producto
                  </label>
                  <select
                    required
                    disabled={!proveedor}
                    value={linea.productoId}
                    onChange={(e) => selectProducto(idx, e.target.value)}
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
                </div>
                <div className="mt-7 flex gap-2">
                  {producto && (
                    <button
                      type="button"
                      onClick={() => setEditingLineIdx(idx)}
                      aria-label="Editar producto"
                      title="Editar producto"
                      className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f5f0e8] text-[#8b7355] hover:bg-[#e8e0d4]"
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                  )}
                  {lineas.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLinea(idx)}
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
                  <label className="mb-2 block text-xs font-medium text-[#8b7355]">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    required
                    value={linea.cantidad}
                    onChange={(e) => updateLinea(idx, { cantidad: e.target.value })}
                    className={numericInputClass}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium text-[#8b7355]">
                    Unidad
                  </label>
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
                    required
                    disabled={!producto}
                    value={linea.precioUnit}
                    onChange={(e) => updateLinea(idx, { precioUnit: e.target.value })}
                    className={numericInputClass}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[#f5f0e8] pt-3 text-sm">
                <div className="text-[#8b7355]">
                  {isNewPrice && producto && (
                    <span className="text-amber-700">
                      Nuevo precio (antes ${producto.precioActual})
                    </span>
                  )}
                </div>
                <div className="font-medium text-[#3d3530]">
                  Subtotal: ${lineTotal.toFixed(2)}
                </div>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={addLinea}
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

        <FormMessage message={error} className="mb-3" />

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl bg-[#c4a77d] py-4 text-base font-medium text-white shadow-sm active:scale-[0.99] disabled:opacity-50"
        >
          {isPending ? "Guardando..." : "Crear Factura"}
        </button>
      </section>

      {editingLineIdx !== null && proveedor && (() => {
        const linea = lineas[editingLineIdx];
        const producto = productoById.get(linea.productoId);
        if (!producto) return null;
        return (
          <EditProductModal
            proveedorId={proveedor.id}
            producto={producto}
            unidades={unidades}
            initialPrecio={linea.precioUnit || producto.precioActual}
            onClose={() => setEditingLineIdx(null)}
            onSaved={(newPrecio) => {
              updateLinea(editingLineIdx, { precioUnit: newPrecio });
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
          onClose={() => setCreatingLineIdx(null)}
          onCreated={(producto) => handleProductCreated(creatingLineIdx, producto)}
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
}) {
  const [unidadId, setUnidadId] = useState(producto.unidadId);
  const [precio, setPrecio] = useState(initialPrecio);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    const precioNum = Number(precio);
    if (!isFinite(precioNum) || precioNum <= 0) {
      setError("Precio inválido.");
      return;
    }
    if (!unidadId) {
      setError("Selecciona una unidad.");
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateProduct(proveedorId, producto.id, {
        nombre: producto.nombre,
        unidadId,
        precio,
      });
      if (!result.ok) {
        setError(result.error);
        setIsSaving(false);
        return;
      }
      onSaved(precio);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium text-[#3d3530]">Editar producto</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Cerrar"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5f0e8] text-[#8b7355] hover:bg-[#e8e0d4]"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-[#8b7355]">
          Los cambios se guardan inmediatamente y afectan esta factura y los valores por defecto del producto.
        </p>

        <div className="mb-4">
          <p className="mb-2 text-xs font-medium text-[#8b7355]">Producto</p>
          <p className="rounded-xl bg-[#faf8f5] px-4 py-3 text-sm text-[#3d3530]">
            {producto.nombre}
          </p>
        </div>

        <div className="mb-4">
          <label htmlFor="modal-unidad" className="mb-2 block text-xs font-medium text-[#8b7355]">
            Unidad
          </label>
          <select
            id="modal-unidad"
            value={unidadId}
            onChange={(e) => setUnidadId(e.target.value)}
            disabled={isSaving}
            className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#3d3530] focus:border-[#c4a77d] focus:outline-none"
          >
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </select>
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
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            disabled={isSaving}
            className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#3d3530] focus:border-[#c4a77d] focus:outline-none"
          />
        </div>

        <FormMessage message={error} className="mb-3" />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 rounded-xl border-2 border-[#e8e0d4] py-3 text-sm font-medium text-[#8b7355]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 rounded-xl bg-[#c4a77d] py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {isSaving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
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
}) {
  const [nombre, setNombre] = useState("");
  const [unidadId, setUnidadId] = useState(unidades[0]?.id ?? "");
  const [precio, setPrecio] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    const trimmed = nombre.trim();
    if (!trimmed) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (!unidadId) {
      setError("Selecciona una unidad.");
      return;
    }
    const precioNum = Number(precio);
    if (!isFinite(precioNum) || precioNum <= 0) {
      setError("Precio inválido.");
      return;
    }
    const cantidadNum = Number(cantidad);
    if (!isFinite(cantidadNum) || cantidadNum <= 0) {
      setError("Cantidad inválida.");
      return;
    }

    setIsSaving(true);
    try {
      const result = await createProductForProvider(
        proveedorId,
        { nombre: trimmed, descripcion: null, unidadId },
        precio,
        cantidad
      );
      if (!result.ok) {
        setError(result.error);
        setIsSaving(false);
        return;
      }
      const unidad = unidades.find((u) => u.id === unidadId);
      onCreated({
        id: result.data.id,
        nombre: result.data.nombre,
        unidadId,
        unidadCodigo: unidad?.codigo ?? "",
        precioActual: precio,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el producto.");
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium text-[#3d3530]">Nuevo producto</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Cerrar"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5f0e8] text-[#8b7355] hover:bg-[#e8e0d4]"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-[#8b7355]">
          Se agregará al catálogo de <span className="font-medium text-[#3d3530]">{proveedorNombre}</span> y quedará disponible para futuras facturas.
        </p>

        <div className="mb-4">
          <label htmlFor="new-prod-nombre" className="mb-2 block text-xs font-medium text-[#8b7355]">
            Nombre
          </label>
          <input
            id="new-prod-nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            disabled={isSaving}
            autoFocus
            className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#3d3530] focus:border-[#c4a77d] focus:outline-none"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="new-prod-unidad" className="mb-2 block text-xs font-medium text-[#8b7355]">
            Unidad
          </label>
          <select
            id="new-prod-unidad"
            value={unidadId}
            onChange={(e) => setUnidadId(e.target.value)}
            disabled={isSaving}
            className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#3d3530] focus:border-[#c4a77d] focus:outline-none"
          >
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </select>
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
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              disabled={isSaving}
              className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#3d3530] focus:border-[#c4a77d] focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="new-prod-cantidad" className="mb-2 block text-xs font-medium text-[#8b7355]">
              Cantidad por pack
            </label>
            <input
              id="new-prod-cantidad"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              disabled={isSaving}
              className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#3d3530] focus:border-[#c4a77d] focus:outline-none"
            />
          </div>
        </div>

        <FormMessage message={error} className="mb-3" />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 rounded-xl border-2 border-[#e8e0d4] py-3 text-sm font-medium text-[#8b7355]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 rounded-xl bg-[#c4a77d] py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {isSaving ? "Guardando..." : "Crear y usar"}
          </button>
        </div>
      </div>
    </div>
  );
}
