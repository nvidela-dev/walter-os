import { requireAccess } from "@/lib/auth/access";
import { extractInvoice, readPhoto } from "@/lib/invoice-photo/extract";
import { claimScanQuota } from "@/lib/invoice-photo/quota";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request): Promise<Response> {
  const reply = (body: unknown, status: number): Response => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
  let actor: string;
  try { actor = await requireAccess("main"); }
  catch { return reply({ error: "No tenés acceso para leer facturas." }, 403); }
  if (request.headers.get("origin") !== new URL(request.url).origin) return reply({ error: "Origen no permitido." }, 403);
  const key = process.env.OPENAI_API_KEY;
  if (key === undefined || key.trim() === "") return reply({ error: "La lectura de fotos todavía no está configurada. Un administrador debe configurar OPENAI_API_KEY en el servidor." }, 503);
  let bytes: Uint8Array;
  try { bytes = await readPhoto(request); }
  catch { return reply({ error: "Usá una foto JPG, PNG o WebP de hasta 3 MB." }, 400); }
  try {
    if (!await claimScanQuota(actor)) return reply({ error: "Límite de lecturas alcanzado. Esperá al menos 15 segundos; máximo 30 por persona y 200 por día." }, 429);
    return reply({ data: await extractInvoice(bytes, key) }, 200);
  } catch {
    // Never log the request, image, API response or credential.
    return reply({ error: "No se pudo leer la foto. Revisá la conexión o la configuración y saldo de la API. Podés completar la factura manualmente." }, 502);
  }
}
