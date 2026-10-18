import type { ReactElement } from "react";

export default function Loading(): ReactElement {
  return <div role="status" aria-live="polite" className="app-page flex items-center justify-center gap-3 text-sm text-muted"><span className="app-spinner" aria-hidden="true" />Cargando…</div>;
}
