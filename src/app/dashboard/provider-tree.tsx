"use client";

import {
  ArchiveBoxIcon,
  ArrowLeftIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  ArrowTopRightOnSquareIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CubeIcon,
  DocumentTextIcon,
  ReceiptPercentIcon,
  TruckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import {
  type ComponentType,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { ProviderNode, TreeInvoice } from "./queries";

// Everforest (dark, medium) — a woodsy palette: warm tan foreground over
// muted forest-green backgrounds, with earthy accent hues.
const c = {
  bg0: "#2d353b",
  bg1: "#272e33",
  bg2: "#343f44",
  bg3: "#3d484d",
  bg4: "#475258",
  fg: "#d3c6aa",
  grey: "#859289",
  grey0: "#7a8478",
  red: "#e67e80",
  orange: "#e69875",
  yellow: "#dbbc7f",
  green: "#a7c080",
  aqua: "#83c092",
  blue: "#7fbbb3",
  purple: "#d699b6",
} as const;

type IconType = ComponentType<{ className?: string; style?: CSSProperties }>;

const openAffordanceClass =
  "shrink-0 rounded p-0.5 opacity-0 transition hover:bg-[#475258] hover:text-[#d3c6aa] group-hover:opacity-100";

function NoIcon(): ReactElement {
  return <span className="inline-block h-4 w-4" />;
}

interface RowProps {
  depth: number;
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  icon: IconType;
  iconColor: string;
  label: ReactNode;
  meta?: ReactNode;
  href?: string;
  onOpen?: () => void;
}

function Row({
  depth,
  expandable = false,
  expanded = false,
  onToggle,
  icon: Icon,
  iconColor,
  label,
  meta,
  href,
  onOpen,
}: RowProps): ReactElement {
  const marginClass = meta != null ? "ml-2" : "ml-auto";
  return (
    <div
      className={`group flex items-stretch hover:bg-[#343f44] ${
        expandable ? "cursor-pointer" : "cursor-default"
      }`}
      onClick={expandable ? onToggle : undefined}
    >
      {Array.from({ length: depth }).map((_, i) => (
        <span
          key={i}
          aria-hidden
          className="shrink-0"
          style={{ width: 18, borderRight: `1px solid ${c.bg3}` }}
        />
      ))}
      <div className="flex min-w-0 flex-1 items-center gap-1.5 py-[3px] pr-2 pl-1.5 text-[13px]">
        <span
          className="flex h-4 w-4 shrink-0 items-center justify-center"
          style={{ color: c.grey0 }}
        >
          {expandable ? (
            expanded ? (
              <ChevronDownIcon className="h-3 w-3" />
            ) : (
              <ChevronRightIcon className="h-3 w-3" />
            )
          ) : null}
        </span>
        <Icon className="h-4 w-4 shrink-0" style={{ color: iconColor }} />
        <span className="truncate">{label}</span>
        {meta != null && (
          <span
            className="ml-auto shrink-0 whitespace-nowrap pl-3 text-[11px]"
            style={{ color: c.grey }}
          >
            {meta}
          </span>
        )}
        {href != null ? (
          <Link
            href={href}
            onClick={(e) => {
              e.stopPropagation();
            }}
            title="open detail page"
            aria-label="open detail page"
            className={`${marginClass} ${openAffordanceClass}`}
            style={{ color: c.grey0 }}
          >
            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
          </Link>
        ) : onOpen != null ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            title="open in panel"
            aria-label="open in panel"
            className={`${marginClass} ${openAffordanceClass}`}
            style={{ color: c.grey0 }}
          >
            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Money({ value }: { value: string }): ReactElement {
  return <span style={{ color: c.yellow }}>${value}</span>;
}

function EmptyLeaf({ depth, text }: { depth: number; text: string }): ReactElement {
  return (
    <Row
      depth={depth}
      icon={NoIcon}
      iconColor={c.grey0}
      label={
        <span className="italic" style={{ color: c.grey0 }}>
          {text}
        </span>
      }
    />
  );
}

function ToolbarButton({
  onClick,
  label,
  icon: Icon,
}: {
  onClick: () => void;
  label: string;
  icon: IconType;
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="rounded p-1 hover:bg-[#3d484d]"
      style={{ color: c.grey }}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

// ── invoice detail "split" ──────────────────────────────────────────────────

function bufferField(key: string, value: ReactNode): ReactNode {
  return (
    <>
      <span className="inline-block w-24" style={{ color: c.blue }}>
        {key}
      </span>
      {value}
    </>
  );
}

function buildInvoiceBuffer(provider: ProviderNode, invoice: TreeInvoice): ReactNode[] {
  const blank = <span>{" "}</span>;
  const lines: ReactNode[] = [];
  lines.push(
    <span style={{ color: c.grey0 }}>
      # invoice <span style={{ color: c.orange }}>#{invoice.number ?? "—"}</span>
    </span>,
    blank,
    bufferField("provider", <span style={{ color: c.fg }}>{provider.name}</span>),
    bufferField("type", <span style={{ color: c.aqua }}>{provider.type}</span>),
    bufferField("date", <span style={{ color: c.fg }}>{invoice.date}</span>),
    bufferField("number", <span style={{ color: c.fg }}>{invoice.number ?? "—"}</span>),
    bufferField(
      "status",
      <span style={{ color: invoice.paid ? c.green : c.orange }}>
        {invoice.paid ? "paid" : "unpaid"}
      </span>
    ),
    bufferField("total", <Money value={invoice.total} />),
    blank,
    <span style={{ color: c.grey0 }}># line items ({invoice.lines.length})</span>
  );

  if (invoice.lines.length === 0) {
    lines.push(
      <span className="italic" style={{ color: c.grey0 }}>
        (no line items)
      </span>
    );
  } else {
    for (const line of invoice.lines) {
      lines.push(
        <span className="flex flex-wrap gap-x-3">
          <span className="min-w-[9rem]" style={{ color: c.fg }}>
            {line.productName}
          </span>
          <span style={{ color: c.grey }}>
            {line.quantity} {line.unit}
          </span>
          <span style={{ color: c.grey0 }}>×</span>
          <Money value={line.unitPrice} />
          <span style={{ color: c.grey0 }}>=</span>
          <Money value={line.total} />
        </span>
      );
    }
  }

  lines.push(
    blank,
    <span style={{ color: c.grey0 }}>
      # total <Money value={invoice.total} />
    </span>
  );
  return lines;
}

function InvoicePanel({
  provider,
  invoice,
  onClose,
}: {
  provider: ProviderNode;
  invoice: TreeInvoice;
  onClose: () => void;
}): ReactElement {
  const buffer = buildInvoiceBuffer(provider, invoice);
  const bufferName = `invoice://${invoice.number ?? invoice.id.slice(0, 8)}`;

  return (
    <aside
      className="flex w-[44%] min-w-[320px] max-w-xl flex-col border-l"
      style={{ borderColor: c.bg3, backgroundColor: c.bg0 }}
    >
      <div
        className="flex items-center justify-between border-b px-3 py-1.5 text-xs"
        style={{ backgroundColor: c.bg1, borderColor: c.bg3 }}
      >
        <span style={{ color: c.grey }}>{bufferName}</span>
        <button
          type="button"
          onClick={onClose}
          title="close (Esc)"
          aria-label="close"
          className="rounded p-1 hover:bg-[#3d484d]"
          style={{ color: c.grey }}
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-auto py-1 text-[13px]">
        {buffer.map((node, i) => (
          <div key={i} className="flex leading-6 hover:bg-[#272e33]">
            <span
              className="w-10 shrink-0 select-none pr-3 text-right"
              style={{ color: c.grey0 }}
            >
              {i + 1}
            </span>
            <div className="min-w-0 flex-1 pr-3">{node}</div>
          </div>
        ))}
      </div>

      <div
        className="flex items-stretch justify-between border-t text-[11px]"
        style={{ backgroundColor: c.bg1, borderColor: c.bg3 }}
      >
        <span className="px-3 py-1 font-semibold" style={{ backgroundColor: c.blue, color: c.bg0 }}>
          INVOICE
        </span>
        <span className="px-3 py-1" style={{ color: c.grey }}>
          {buffer.length} lines
        </span>
      </div>
    </aside>
  );
}

// ── tree ────────────────────────────────────────────────────────────────────

interface Selection {
  provider: ProviderNode;
  invoice: TreeInvoice;
}

export function ProviderTree({ providers }: { providers: ProviderNode[] }): ReactElement {
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Selection | null>(null);

  const searching = query.trim() !== "";

  const filtered = useMemo<ProviderNode[]>(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return providers;
    const result: ProviderNode[] = [];
    for (const p of providers) {
      const provMatch = p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q);
      const products = provMatch
        ? p.products
        : p.products.filter(
            (pr) => pr.name.toLowerCase().includes(q) || pr.unit.toLowerCase().includes(q)
          );
      const invoices: TreeInvoice[] = [];
      for (const inv of p.invoices) {
        const invMatch =
          provMatch ||
          (inv.number?.toLowerCase().includes(q) ?? false) ||
          inv.date.toLowerCase().includes(q);
        const lines = invMatch
          ? inv.lines
          : inv.lines.filter((l) => l.productName.toLowerCase().includes(q));
        if (invMatch || lines.length > 0) invoices.push({ ...inv, lines });
      }
      if (provMatch || products.length > 0 || invoices.length > 0) {
        result.push({ ...p, products, invoices });
      }
    }
    return result;
  }, [providers, query]);

  const { allIds, totalProducts, totalInvoices } = useMemo(() => {
    const ids: string[] = [];
    let products = 0;
    let invoices = 0;
    for (const p of filtered) {
      ids.push(`p:${p.id}`, `pg:${p.id}`, `ig:${p.id}`);
      products += p.products.length;
      invoices += p.invoices.length;
      for (const inv of p.invoices) ids.push(`i:${inv.id}`);
    }
    return { allIds: ids, totalProducts: products, totalInvoices: invoices };
  }, [filtered]);

  useEffect(() => {
    if (selected == null) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return (): void => {
      window.removeEventListener("keydown", onKey);
    };
  }, [selected]);

  // While searching, force every surviving branch open so matches are visible.
  const expandedOf = (id: string): boolean => (searching ? true : open.has(id));
  const toggle = (id: string): void => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div
      className="flex h-screen flex-col font-[family-name:var(--font-geist-mono)]"
      style={{ backgroundColor: c.bg0, color: c.fg }}
    >
      {/* winbar */}
      <header
        className="flex items-center justify-between border-b px-3 py-1.5 text-xs"
        style={{ backgroundColor: c.bg1, borderColor: c.bg3 }}
      >
        <div className="flex items-center gap-2">
          <Link
            href="/"
            aria-label="back"
            className="flex h-6 w-6 items-center justify-center rounded hover:bg-[#3d484d]"
            style={{ color: c.grey }}
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
          <span className="rounded px-2 py-0.5" style={{ backgroundColor: c.bg3, color: c.fg }}>
            walter-os
          </span>
          <ChevronRightIcon className="h-3 w-3" style={{ color: c.grey0 }} />
          <span style={{ color: c.green }}>providers</span>
        </div>
        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={() => {
              setOpen(new Set(allIds));
            }}
            label="expand all"
            icon={ArrowsPointingOutIcon}
          />
          <ToolbarButton
            onClick={() => {
              setOpen(new Set());
            }}
            label="collapse all"
            icon={ArrowsPointingInIcon}
          />
        </div>
      </header>

      {/* vim-style search line */}
      <div
        className="flex items-center gap-2 border-b px-3 py-1"
        style={{ backgroundColor: c.bg1, borderColor: c.bg3 }}
      >
        <span style={{ color: c.green }}>/</span>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          placeholder="search providers, products, invoices…"
          spellCheck={false}
          className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#7a8478]"
          style={{ color: c.fg }}
        />
        {searching && (
          <>
            <span className="shrink-0 text-[11px]" style={{ color: c.grey }}>
              {filtered.length}/{providers.length}
            </span>
            <button
              type="button"
              onClick={() => {
                setQuery("");
              }}
              title="clear search"
              aria-label="clear search"
              className="rounded p-0.5 hover:bg-[#3d484d]"
              style={{ color: c.grey }}
            >
              <XMarkIcon className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>

      {/* split: tree + optional invoice panel */}
      <div className="flex min-h-0 flex-1">
        <div className="flex-1 overflow-auto py-1">
          {filtered.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm" style={{ color: c.grey0 }}>
              {searching ? "no matches" : "no providers"}
            </p>
          ) : (
            filtered.map((provider) => {
              const providerOpen = expandedOf(`p:${provider.id}`);
              const productsOpen = expandedOf(`pg:${provider.id}`);
              const invoicesOpen = expandedOf(`ig:${provider.id}`);
              const debt = Number(provider.debt);
              return (
                <div key={provider.id}>
                  <Row
                    depth={0}
                    expandable
                    expanded={providerOpen}
                    onToggle={() => {
                      toggle(`p:${provider.id}`);
                    }}
                    icon={TruckIcon}
                    iconColor={c.green}
                    label={<span style={{ color: c.fg }}>{provider.name}</span>}
                    meta={
                      <>
                        <span style={{ color: c.aqua }}>{provider.type}</span>
                        {" · "}
                        {provider.products.length} prod {" · "}
                        {provider.invoices.length} inv
                        {debt > 0 && (
                          <>
                            {" · "}
                            <span style={{ color: c.red }}>${provider.debt}</span>
                          </>
                        )}
                      </>
                    }
                    href={`/providers/${provider.id}`}
                  />

                  {providerOpen && (
                    <>
                      {/* products group */}
                      <Row
                        depth={1}
                        expandable
                        expanded={productsOpen}
                        onToggle={() => {
                          toggle(`pg:${provider.id}`);
                        }}
                        icon={ArchiveBoxIcon}
                        iconColor={c.aqua}
                        label={<span style={{ color: c.aqua }}>products</span>}
                        meta={`${provider.products.length}`}
                      />
                      {productsOpen &&
                        (provider.products.length === 0 ? (
                          <EmptyLeaf depth={2} text="no products" />
                        ) : (
                          provider.products.map((product) => (
                            <Row
                              key={product.productId}
                              depth={2}
                              icon={CubeIcon}
                              iconColor={c.fg}
                              label={product.name}
                              meta={
                                <>
                                  <Money value={product.price} /> /{product.unit}
                                </>
                              }
                              href={`/providers/${provider.id}/products/${product.productId}`}
                            />
                          ))
                        ))}

                      {/* invoices group */}
                      <Row
                        depth={1}
                        expandable
                        expanded={invoicesOpen}
                        onToggle={() => {
                          toggle(`ig:${provider.id}`);
                        }}
                        icon={DocumentTextIcon}
                        iconColor={c.blue}
                        label={<span style={{ color: c.blue }}>invoices</span>}
                        meta={`${provider.invoices.length}`}
                      />
                      {invoicesOpen &&
                        (provider.invoices.length === 0 ? (
                          <EmptyLeaf depth={2} text="no invoices" />
                        ) : (
                          provider.invoices.map((invoice) => {
                            const invoiceOpen = expandedOf(`i:${invoice.id}`);
                            const isSelected = selected?.invoice.id === invoice.id;
                            return (
                              <div key={invoice.id}>
                                <Row
                                  depth={2}
                                  expandable
                                  expanded={invoiceOpen}
                                  onToggle={() => {
                                    toggle(`i:${invoice.id}`);
                                  }}
                                  icon={ReceiptPercentIcon}
                                  iconColor={c.orange}
                                  label={
                                    <>
                                      <span style={{ color: isSelected ? c.yellow : c.orange }}>
                                        #{invoice.number ?? "—"}
                                      </span>{" "}
                                      <span style={{ color: c.grey }}>{invoice.date}</span>
                                    </>
                                  }
                                  meta={
                                    <>
                                      <Money value={invoice.total} />
                                      {" · "}
                                      <span style={{ color: invoice.paid ? c.green : c.orange }}>
                                        {invoice.paid ? "paid" : "unpaid"}
                                      </span>
                                    </>
                                  }
                                  onOpen={() => {
                                    setSelected({ provider, invoice });
                                  }}
                                />
                                {invoiceOpen &&
                                  (invoice.lines.length === 0 ? (
                                    <EmptyLeaf depth={3} text="no line items" />
                                  ) : (
                                    invoice.lines.map((line) => (
                                      <Row
                                        key={line.id}
                                        depth={3}
                                        icon={CubeIcon}
                                        iconColor={c.purple}
                                        label={line.productName}
                                        meta={
                                          <>
                                            <span style={{ color: c.yellow }}>{line.quantity}</span>{" "}
                                            {line.unit} {"× "}
                                            <Money value={line.unitPrice} /> {"= "}
                                            <Money value={line.total} />
                                          </>
                                        }
                                        href={`/providers/${provider.id}/products/${line.productId}`}
                                      />
                                    ))
                                  ))}
                              </div>
                            );
                          })
                        ))}
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {selected != null && (
          <InvoicePanel
            provider={selected.provider}
            invoice={selected.invoice}
            onClose={() => {
              setSelected(null);
            }}
          />
        )}
      </div>

      {/* lualine */}
      <footer
        className="flex items-stretch justify-between border-t text-[11px]"
        style={{ backgroundColor: c.bg1, borderColor: c.bg3 }}
      >
        <div className="flex items-stretch">
          <span
            className="px-3 py-1 font-semibold"
            style={{ backgroundColor: c.green, color: c.bg0 }}
          >
            NORMAL
          </span>
          <span className="px-3 py-1" style={{ backgroundColor: c.bg3, color: c.fg }}>
            dashboard/providers
          </span>
        </div>
        <div className="flex items-stretch" style={{ color: c.grey }}>
          <span className="px-3 py-1">
            {filtered.length} providers · {totalProducts} products · {totalInvoices} invoices
          </span>
          <span className="px-3 py-1" style={{ backgroundColor: c.bg3, color: c.fg }}>
            tree
          </span>
        </div>
      </footer>
    </div>
  );
}
