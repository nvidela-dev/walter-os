"use client";

import { type ChangeEvent, type ReactElement, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { type ExtractedInvoice, extractedInvoiceSchema, MAX_PHOTO_BYTES } from "@/lib/invoice-photo/schema";

async function preparePhoto(file: File): Promise<Blob> {
  if (file.size > 20 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Elegí JPG, PNG o WebP de hasta 20 MB. Si es HEIC, exportala como JPG.");
  }
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 40_000_000) throw new Error("La foto es demasiado grande. Usá una resolución menor.");
    const scale = Math.min(1, 2200 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (context === null) throw new Error("No se pudo preparar la foto.");
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => { canvas.toBlob((value) => {
      if (value === null) reject(new Error("No se pudo preparar la foto."));
      else resolve(value);
    }, "image/jpeg", 0.88); });
    if (blob.size > MAX_PHOTO_BYTES) throw new Error("La foto sigue siendo demasiado grande. Recortá el fondo e intentá de nuevo.");
    return blob;
  } finally { bitmap.close(); }
}

export function InvoicePhoto({ onExtracted, disabled, onBusy }: { onBusy: (busy: boolean) => void; onExtracted: (data: ExtractedInvoice) => void; disabled: boolean }): ReactElement {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  const [extracted, setExtracted] = useState(false);
  useEffect((): (() => void) | undefined => {
    if (file === null) return;
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => { URL.revokeObjectURL(next); };
  }, [file]);
  function select(event: ChangeEvent<HTMLInputElement>): void {
    setFile(event.target.files?.[0] ?? null);
    setError(null);
  }
  async function scan(): Promise<void> {
    if (file === null || lock.current) return;
    lock.current = true;
    setBusy(true);
    onBusy(true);
    setError(null);
    try {
      const blob = await preparePhoto(file);
      const response = await fetch("/api/invoices/extract", { method: "POST", headers: { "Content-Type": "image/jpeg" }, body: blob, signal: AbortSignal.timeout(60_000) });
      const result: unknown = await response.json();
      if (typeof result !== "object" || result === null) throw new Error("Respuesta inválida.");
      if ("error" in result && typeof result.error === "string") throw new Error(result.error);
      if (!response.ok || !("data" in result)) throw new Error("No se pudo leer la foto.");
      onExtracted(extractedInvoiceSchema.parse(result.data));
      setExtracted(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo leer la foto.");
    } finally { lock.current = false; setBusy(false); onBusy(false); }
  }
  return <section className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
    <h2 className="font-semibold">Cargar desde una foto</h2>
    <p className="text-sm text-muted">Fotografiá la factura completa y legible. Se envía a OpenAI al tocar «Leer foto». Revisá todo antes de guardar. Walter no guarda la imagen.</p>
    {!extracted && <>
      <label className="block text-sm font-medium">Tomar foto
        <input aria-label="Tomar foto" className="mt-2 block w-full text-sm" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={select} disabled={busy || disabled} />
      </label>
      <label className="block text-sm font-medium">O elegir imagen
        <input aria-label="Elegir imagen" className="mt-2 block w-full text-sm" type="file" accept="image/jpeg,image/png,image/webp" onChange={select} disabled={busy || disabled} />
      </label>
      <Button type="button" onClick={() => { void scan(); }} disabled={file === null || busy || disabled}>{busy ? "Leyendo…" : "Leer foto y completar borrador"}</Button>
      <p className="text-xs text-muted">La lectura reemplaza los datos del borrador. Una foto por factura; para varias páginas, completá las líneas restantes manualmente.</p>
    </>}
    {url !== "" && <details open><summary className="cursor-pointer text-sm font-medium">Foto original · abrir para ampliar</summary>
      <a href={url} target="_blank" rel="noreferrer">
        {/* Local object URL; bypass image optimization and avoid uploading the original. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="Foto original de la factura para revisar" className="mt-2 max-h-96 w-full rounded-lg object-contain" />
      </a>
    </details>}
    {error !== null && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </section>;
}
