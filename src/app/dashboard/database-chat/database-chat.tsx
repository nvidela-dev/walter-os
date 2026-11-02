"use client";

import { ArrowUpIcon, ChatBubbleLeftRightIcon, TrashIcon } from "@heroicons/react/24/outline";
import { type ReactElement, type SyntheticEvent, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Message { role: "user" | "assistant"; content: string }

const suggestions = [
  "¿Cuántas facturas vencidas tenemos y cuál es el total?",
  "¿Qué proveedores nos vendieron más recientemente?",
  "¿Qué productos tienen objetivo de inventario?",
];

export function DatabaseChat(): ReactElement {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = bottomRef.current;
    if (typeof element?.scrollIntoView !== "function") return;
    try { element.scrollIntoView({ behavior: "smooth", block: "end" }); }
    catch { /* Scrolling is optional; it must not interrupt a chat request. */ }
  }, [messages, busy]);

  async function sendMessage(event?: SyntheticEvent<HTMLFormElement>, suggestedMessage?: string): Promise<void> {
    event?.preventDefault();
    const content = (suggestedMessage ?? draft).trim();
    if (content.length === 0 || busy) return;

    const nextMessages = [...messages, { role: "user" as const, content }];
    setMessages(nextMessages);
    setDraft("");
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/admin/database-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.slice(-12) }),
      });
      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new Error(`El servidor respondió de forma inesperada (HTTP ${response.status}). Probá de nuevo.`);
      }
      const answer = typeof payload === "object" && payload !== null && "answer" in payload && typeof payload.answer === "string" ? payload.answer : null;
      if (!response.ok || answer === null) {
        const message = typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string" ? payload.error : "No se pudo obtener una respuesta.";
        const reference = typeof payload === "object" && payload !== null && "requestId" in payload && typeof payload.requestId === "string" ? ` Referencia: ${payload.requestId}.` : "";
        throw new Error(`${message}${reference}${response.ok ? ` (HTTP ${response.status})` : ""}`);
      }
      setMessages((current) => [...current, { role: "assistant", content: answer }]);
    } catch (sendError) {
      setDraft((current) => current.length === 0 ? content : current);
      setError(sendError instanceof Error ? sendError.message : "No se pudo enviar la consulta. Intentá de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="flex min-h-[min(72vh,760px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white"><ChatBubbleLeftRightIcon className="h-5 w-5" aria-hidden="true" /></span>
        <div><p className="font-semibold">GPT Luna</p><p className="text-xs text-muted">Consultas de solo lectura</p></div>
      </div>
      {messages.length > 0 && <Button variant="ghost" size="compact" onClick={() => { setMessages([]); setError(""); }} aria-label="Borrar conversación"><TrashIcon className="h-4 w-4" />Nueva conversación</Button>}
    </header>

    <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5" aria-live="polite" aria-label="Conversación con Luna">
      {messages.length === 0 ? <div className="mx-auto flex max-w-lg flex-col items-center py-8 text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-800"><ChatBubbleLeftRightIcon className="h-7 w-7" aria-hidden="true" /></span>
        <h2 className="text-lg font-semibold">¿Qué querés saber de Walter?</h2>
        <p className="mt-2 text-sm text-muted">Preguntá en tus palabras. Luna revisa los datos actuales de la base y te explica qué encontró.</p>
        <div className="mt-6 grid w-full gap-2 text-left">
          {suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => void sendMessage(undefined, suggestion)} disabled={busy} className="app-press rounded-xl border border-slate-200 px-4 py-3 text-sm transition hover:border-emerald-700 hover:bg-emerald-50 disabled:opacity-50">{suggestion}</button>)}
        </div>
      </div> : messages.map((message, index) => <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
        <div className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[78%] ${message.role === "user" ? "rounded-br-md bg-emerald-800 text-white" : "rounded-bl-md bg-slate-100 text-foreground"}`}>
          {message.content}
        </div>
      </div>)}
      {busy && <div className="flex justify-start"><div className="rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3 text-sm text-muted"><span className="app-spinner mr-2 inline-block align-middle" aria-hidden="true" />Revisando los datos…</div></div>}
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      <div ref={bottomRef} />
    </div>

    <form onSubmit={(event) => { void sendMessage(event); }} className="border-t border-slate-200 bg-white p-3 sm:p-4">
      <div className="flex items-end gap-2">
        <Textarea value={draft} onChange={(event) => { setDraft(event.target.value); }} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} maxLength={2_000} rows={2} placeholder="Escribí tu pregunta…" aria-label="Tu pregunta para Luna" disabled={busy} className="max-h-36 min-h-[3.25rem] resize-y" />
        <Button type="submit" size="icon" busy={busy} disabled={draft.trim().length === 0} aria-label="Enviar pregunta"><ArrowUpIcon className="h-5 w-5" /></Button>
      </div>
      <p className="mt-2 px-1 text-xs text-muted">Enter para enviar · Shift + Enter para escribir en otra línea</p>
    </form>
  </section>;
}
