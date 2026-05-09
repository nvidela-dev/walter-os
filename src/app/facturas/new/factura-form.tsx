"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import { createFactura } from "../actions";

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

export function FacturaForm({ proveedores }: { proveedores: FormProveedor[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [proveedorId, setProveedorId] = useState("");
  const [fecha, setFecha] = useState(todayLocal);
  const [numero, setNumero] = useState("");
  const [notas, setNotas] = useState("");
  const [lineas, setLineas] = useState<LineaState[]>([emptyLinea()]);

  const proveedor = proveedores.find((p) => p.id === proveedorId);
  const productos = useMemo(() => proveedor?.productos ?? [], [proveedor]);
  const productoById = useMemo(() => {
    const map = new Map<string, FormProducto>();
    for (const p of productos) map.set(p.id, p);
    return map;
  }, [productos]);

  const total = lineas.reduce(
    (sum, l) => sum + Number(l.precioUnit || 0) * Number(l.cantidad || 0),
    0
  );

  function changeProveedor(id: string) {
    setProveedorId(id);
    setLineas([emptyLinea()]);
  }

  function updateLinea(idx: number, patch: Partial<LineaState>) {
    setLineas((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function selectProducto(idx: number, productoId: string) {
    const producto = productoById.get(productoId);
    updateLinea(idx, {
      productoId,
      precioUnit: producto?.precioActual ?? "",
    });
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
        await createFactura({
          proveedorId,
          fecha,
          numero: numero.trim() || null,
          notas: notas.trim() || null,
          lineas: payloadLineas,
        });
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
            <option value="">Selecciona un proveedor</option>
            {proveedores.map((p) => (
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
                  </select>
                </div>
                {lineas.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLinea(idx)}
                    aria-label="Quitar línea"
                    className="mt-7 flex h-12 w-12 items-center justify-center rounded-xl bg-[#f5f0e8] text-[#8b7355] hover:bg-[#e8e0d4]"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                )}
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

      <section className="rounded-2xl bg-[#f5f0e8] p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-[#8b7355]">Total</span>
          <span className="text-2xl font-light text-[#3d3530]">${total.toFixed(2)}</span>
        </div>

        {error && (
          <p className="mb-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl bg-[#c4a77d] py-4 text-base font-medium text-white shadow-sm active:scale-[0.99] disabled:opacity-50"
        >
          {isPending ? "Guardando..." : "Crear Factura"}
        </button>
      </section>
    </form>
  );
}
