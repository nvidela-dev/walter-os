import type { ReactElement, ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  /** Renders the cell. Return `null` to fall back to the muted em-dash. */
  render: (row: T) => ReactNode;
  /** Render in monospace + muted (ids, codes). */
  mono?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
}

const EMPTY = <span className="text-slate-600">—</span>;

export function DataTable<T>({ columns, rows, getRowKey }: DataTableProps<T>): ReactElement {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/40">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-800 text-left">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-3 py-2 text-xs font-medium uppercase tracking-wider text-slate-500 ${
                  col.align === "right" ? "text-right" : "text-left"
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={getRowKey(row)}
              className="border-b border-slate-800/60 last:border-0 hover:bg-slate-800/30"
            >
              {columns.map((col) => {
                const value = col.render(row);
                return (
                  <td
                    key={col.key}
                    className={`whitespace-nowrap px-3 py-2 align-top ${
                      col.align === "right" ? "text-right" : "text-left"
                    } ${col.mono === true ? "text-slate-500" : "text-slate-200"}`}
                  >
                    {value === null || value === undefined || value === "" ? EMPTY : value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Short, monospace UUID with full value on hover. */
export function ShortId({ id }: { id: string }): ReactElement {
  return (
    <span title={id} className="font-mono text-xs text-slate-500">
      {id.slice(0, 8)}
    </span>
  );
}

/** Green/red pill for booleans. */
export function BoolBadge({ value, trueLabel, falseLabel }: {
  value: boolean;
  trueLabel: string;
  falseLabel: string;
}): ReactElement {
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
        value ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
      }`}
    >
      {value ? trueLabel : falseLabel}
    </span>
  );
}

/** Right-aligned monetary value with a muted currency sign. */
export function Money({ value }: { value: string }): ReactElement {
  return (
    <span className="font-mono tabular-nums text-slate-200">
      <span className="text-slate-500">$</span>
      {value}
    </span>
  );
}
