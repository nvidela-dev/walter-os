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
  PlusIcon,
  ReceiptPercentIcon,
  TruckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type ComponentType,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

import {
  createInvoice,
  getProductPriceHistory,
  type PriceHistoryRow,
} from "@/app/invoices/actions";
import { createProductForProvider } from "@/app/providers/actions";

import type { ProviderNode, TreeInvoice, TreeProduct } from "./queries";

interface Unit {
  id: string;
  code: string;
  name: string;
}

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

function BufferView({
  bufferName,
  lines,
  statusLabel,
  statusColor,
  headerExtra,
  onClose,
}: {
  bufferName: string;
  lines: ReactNode[];
  statusLabel: string;
  statusColor: string;
  headerExtra?: ReactNode;
  onClose: () => void;
}): ReactElement {
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
        <div className="flex items-center gap-1">
          {headerExtra}
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
      </div>

      <div className="flex-1 overflow-auto py-1 text-[13px]">
        {lines.map((node, i) => (
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
        <span
          className="px-3 py-1 font-semibold"
          style={{ backgroundColor: statusColor, color: c.bg0 }}
        >
          {statusLabel}
        </span>
        <span className="px-3 py-1" style={{ color: c.grey }}>
          {lines.length} lines
        </span>
      </div>
    </aside>
  );
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
  return (
    <BufferView
      bufferName={`invoice://${invoice.number ?? invoice.id.slice(0, 8)}`}
      lines={buildInvoiceBuffer(provider, invoice)}
      statusLabel="INVOICE"
      statusColor={c.blue}
      onClose={onClose}
    />
  );
}

function buildProductBuffer(
  provider: ProviderNode,
  product: TreeProduct,
  history: PriceHistoryRow[] | null,
  error: string | null
): ReactNode[] {
  const blank = <span>{" "}</span>;
  const lines: ReactNode[] = [];
  lines.push(
    <span style={{ color: c.grey0 }}>
      # product <span style={{ color: c.fg }}>{product.name}</span>
    </span>,
    blank,
    bufferField("provider", <span style={{ color: c.fg }}>{provider.name}</span>),
    bufferField("type", <span style={{ color: c.aqua }}>{provider.type}</span>),
    bufferField("unit", <span style={{ color: c.fg }}>{product.unit}</span>),
    bufferField(
      "price",
      <>
        <Money value={product.price} />{" "}
        <span style={{ color: c.grey0 }}>/{product.unit} (current)</span>
      </>
    ),
    blank
  );

  if (error != null) {
    lines.push(
      <span className="italic" style={{ color: c.red }}>
        {error}
      </span>
    );
    return lines;
  }
  if (history == null) {
    lines.push(
      <span className="italic" style={{ color: c.grey0 }}>
        loading price history…
      </span>
    );
    return lines;
  }

  lines.push(<span style={{ color: c.grey0 }}># price history ({history.length})</span>);
  if (history.length === 0) {
    lines.push(
      <span className="italic" style={{ color: c.grey0 }}>
        (no recorded changes)
      </span>
    );
    return lines;
  }

  for (const [idx, row] of history.entries()) {
    const older = history[idx + 1];
    let trend: ReactNode = <span style={{ color: c.grey0 }}> </span>;
    if (older != null) {
      const diff = Number(row.price) - Number(older.price);
      if (diff > 0) trend = <span style={{ color: c.red }}>↑</span>;
      else if (diff < 0) trend = <span style={{ color: c.green }}>↓</span>;
      else trend = <span style={{ color: c.grey0 }}>·</span>;
    }
    const date = row.invoiceDate ?? new Date(row.createdAt).toISOString().slice(0, 10);
    lines.push(
      <span className="flex flex-wrap items-center gap-x-3">
        <span style={{ color: c.grey }}>{date}</span>
        <Money value={row.price} />
        {trend}
        {row.invoiceNumber != null && (
          <span style={{ color: c.orange }}>#{row.invoiceNumber}</span>
        )}
      </span>
    );
  }
  return lines;
}

function ProductPanel({
  provider,
  product,
  onClose,
}: {
  provider: ProviderNode;
  product: TreeProduct;
  onClose: () => void;
}): ReactElement {
  const [history, setHistory] = useState<PriceHistoryRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Panel is keyed per product, so it remounts fresh — no in-effect reset needed.
  // `token` lives on an object so a stale async resolve after unmount is ignored.
  useEffect(() => {
    const token = { active: true };
    void (async (): Promise<void> => {
      try {
        const rows = await getProductPriceHistory(product.productId, { providerId: provider.id });
        if (token.active) setHistory(rows);
      } catch {
        if (token.active) setError("failed to load price history");
      }
    })();
    return (): void => {
      token.active = false;
    };
  }, [provider.id, product.productId]);

  return (
    <BufferView
      bufferName={`product://${product.name}`}
      lines={buildProductBuffer(provider, product, history, error)}
      statusLabel="PRODUCT"
      statusColor={c.purple}
      headerExtra={
        <Link
          href={`/providers/${provider.id}/products/${product.productId}`}
          title="open detail page"
          aria-label="open detail page"
          className="rounded p-1 hover:bg-[#3d484d]"
          style={{ color: c.grey }}
        >
          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
        </Link>
      }
      onClose={onClose}
    />
  );
}

// ── add invoice ("A") ───────────────────────────────────────────────────────

function num(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function todayLocal(): string {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

const fieldClass =
  "w-full rounded border border-[#3d484d] bg-[#2d353b] px-2 py-1 text-[13px] text-[#d3c6aa] outline-none focus:border-[#a7c080] placeholder:text-[#7a8478]";

function AddInvoicePanel({
  providers,
  units,
  onClose,
  onCreated,
}: {
  providers: ProviderNode[];
  units: Unit[];
  onClose: () => void;
  onCreated: () => void;
}): ReactElement {
  const [providerId, setProviderId] = useState("");
  const [date, setDate] = useState(todayLocal);
  const [number, setNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [amount, setAmount] = useState("");
  const [lineInputs, setLineInputs] = useState<Record<string, { qty: string; price: string }>>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Products created inline during this session, so they show as line rows
  // immediately (they are already persisted by createProductForProvider).
  const [extraProducts, setExtraProducts] = useState<TreeProduct[]>([]);
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [npName, setNpName] = useState("");
  const [npUnitId, setNpUnitId] = useState(units[0]?.id ?? "");
  const [npPrice, setNpPrice] = useState("");
  const [npQty, setNpQty] = useState("1");
  const [npError, setNpError] = useState<string | null>(null);
  const [npSaving, setNpSaving] = useState(false);

  const provider = providers.find((p) => p.id === providerId) ?? null;
  const isService = provider?.type === "servicio";
  const products =
    provider == null
      ? []
      : extraProducts.length === 0
        ? provider.products
        : [...provider.products, ...extraProducts];

  function changeProvider(id: string): void {
    setProviderId(id);
    setAmount("");
    setError(null);
    setExtraProducts([]);
    setShowNewProduct(false);
    setNpError(null);
    const p = providers.find((x) => x.id === id);
    const next: Record<string, { qty: string; price: string }> = {};
    if (p != null) {
      for (const prod of p.products) next[prod.productId] = { qty: "", price: prod.price };
    }
    setLineInputs(next);
  }

  async function createProduct(): Promise<void> {
    if (provider == null) return;
    setNpError(null);
    const name = npName.trim();
    if (name === "") {
      setNpError("name required");
      return;
    }
    if (npUnitId === "") {
      setNpError("select a unit");
      return;
    }
    if (num(npPrice) <= 0) {
      setNpError("enter a price");
      return;
    }
    if (num(npQty) <= 0) {
      setNpError("enter a pack quantity");
      return;
    }
    setNpSaving(true);
    try {
      const result = await createProductForProvider(
        provider.id,
        { name, description: null, unitId: npUnitId },
        npPrice,
        npQty
      );
      if (!result.ok) {
        setNpError(result.error);
        setNpSaving(false);
        return;
      }
      const created: TreeProduct = {
        productId: result.data.id,
        name: result.data.name,
        unit: result.data.unit,
        price: npPrice,
      };
      setExtraProducts((prev) => [...prev, created]);
      setLineInputs((prev) => ({
        ...prev,
        [created.productId]: { qty: "1", price: npPrice },
      }));
      setNpName("");
      setNpPrice("");
      setNpQty("1");
      setShowNewProduct(false);
      setNpSaving(false);
    } catch {
      setNpError("failed to create product");
      setNpSaving(false);
    }
  }

  function updateLine(productId: string, patch: Partial<{ qty: string; price: string }>): void {
    setLineInputs((prev) => {
      const cur = prev[productId] ?? { qty: "", price: "" };
      return { ...prev, [productId]: { ...cur, ...patch } };
    });
  }

  let total = 0;
  if (isService) {
    total = num(amount);
  } else {
    for (const prod of products) {
      const li = lineInputs[prod.productId];
      if (li != null) total += num(li.qty) * num(li.price);
    }
  }

  function submit(): void {
    setError(null);
    if (provider == null) {
      setError("select a provider");
      return;
    }
    const trimmedNumber = number.trim();
    const trimmedNotes = notes.trim();
    const base = {
      providerId: provider.id,
      date,
      number: trimmedNumber === "" ? null : trimmedNumber,
      notes: trimmedNotes === "" ? null : trimmedNotes,
    };

    let input: Record<string, unknown>;
    if (isService) {
      if (num(amount) <= 0) {
        setError("enter an amount greater than 0");
        return;
      }
      input = { ...base, amount };
    } else {
      const lines: { productId: string; unitPrice: string; quantity: string }[] = [];
      for (const prod of products) {
        const li = lineInputs[prod.productId];
        if (li == null || num(li.qty) <= 0) continue;
        if (num(li.price) <= 0) {
          setError(`enter a price for ${prod.name}`);
          return;
        }
        lines.push({ productId: prod.productId, unitPrice: li.price, quantity: li.qty });
      }
      if (lines.length === 0) {
        setError("add a quantity to at least one product");
        return;
      }
      input = { ...base, lines };
    }

    startTransition(async () => {
      try {
        const result = await createInvoice(input);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        onCreated();
      } catch {
        setError("failed to create invoice");
      }
    });
  }

  return (
    <aside
      className="flex w-[44%] min-w-[340px] max-w-xl flex-col border-l"
      style={{ borderColor: c.bg3, backgroundColor: c.bg0 }}
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
          e.preventDefault();
          submit();
        }
      }}
    >
      <div
        className="flex items-center justify-between border-b px-3 py-1.5 text-xs"
        style={{ backgroundColor: c.bg1, borderColor: c.bg3 }}
      >
        <span style={{ color: c.grey }}>invoice://new</span>
        <button
          type="button"
          onClick={onClose}
          title="cancel (Esc)"
          aria-label="cancel"
          className="rounded p-1 hover:bg-[#3d484d]"
          style={{ color: c.grey }}
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-auto px-3 py-3 text-[13px]">
        <div>
          <label className="mb-1 block text-[11px]" style={{ color: c.blue }}>
            provider
          </label>
          <select
            autoFocus
            value={providerId}
            onChange={(e) => {
              changeProvider(e.target.value);
            }}
            className={fieldClass}
          >
            <option value="">select provider…</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.type}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-[11px]" style={{ color: c.blue }}>
              date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
              }}
              className={`${fieldClass} [color-scheme:dark]`}
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px]" style={{ color: c.blue }}>
              number
            </label>
            <input
              type="text"
              value={number}
              onChange={(e) => {
                setNumber(e.target.value);
              }}
              placeholder="optional"
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[11px]" style={{ color: c.blue }}>
            notes
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
            }}
            placeholder="optional"
            className={fieldClass}
          />
        </div>

        {provider == null ? (
          <p className="italic" style={{ color: c.grey0 }}>
            pick a provider to add line items
          </p>
        ) : isService ? (
          <div>
            <label className="mb-1 block text-[11px]" style={{ color: c.blue }}>
              amount
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
              }}
              placeholder="0.00"
              className={fieldClass}
            />
          </div>
        ) : (
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[11px]" style={{ color: c.blue }}>
                line items
              </span>
              <span className="text-[11px]" style={{ color: c.grey0 }}>
                qty × price
              </span>
            </div>
            {products.length === 0 ? (
              <p className="italic" style={{ color: c.grey0 }}>
                no products in catalog — add one from the provider page first
              </p>
            ) : (
              <div className="space-y-1">
                {products.map((prod) => {
                  const li = lineInputs[prod.productId] ?? { qty: "", price: prod.price };
                  const active = num(li.qty) > 0;
                  const changed = li.price.trim() !== "" && num(li.price) !== num(prod.price);
                  return (
                    <div
                      key={prod.productId}
                      className="flex items-center gap-2 rounded px-1 py-0.5"
                      style={{ backgroundColor: active ? c.bg2 : "transparent" }}
                    >
                      <span
                        className="w-28 shrink-0 truncate"
                        style={{ color: active ? c.fg : c.grey }}
                      >
                        {prod.name}
                      </span>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        value={li.qty}
                        onChange={(e) => {
                          updateLine(prod.productId, { qty: e.target.value });
                        }}
                        placeholder="0"
                        aria-label={`quantity for ${prod.name}`}
                        className={`${fieldClass} w-14`}
                      />
                      <span className="w-6 shrink-0 text-[11px]" style={{ color: c.grey0 }}>
                        {prod.unit}
                      </span>
                      <span style={{ color: c.grey0 }}>×</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        value={li.price}
                        onChange={(e) => {
                          updateLine(prod.productId, { price: e.target.value });
                        }}
                        aria-label={`price for ${prod.name}`}
                        className={`${fieldClass} w-20`}
                      />
                      {changed && (
                        <span
                          className="shrink-0 text-[11px]"
                          style={{ color: c.orange }}
                          title="price changed — recorded in history"
                        >
                          was ${prod.price}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {showNewProduct ? (
              <div className="mt-2 space-y-2 rounded border p-2" style={{ borderColor: c.bg3 }}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px]" style={{ color: c.aqua }}>
                    new product
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewProduct(false);
                      setNpError(null);
                    }}
                    aria-label="cancel new product"
                    className="rounded p-0.5 hover:bg-[#3d484d]"
                    style={{ color: c.grey }}
                  >
                    <XMarkIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  value={npName}
                  onChange={(e) => {
                    setNpName(e.target.value);
                  }}
                  placeholder="name"
                  className={fieldClass}
                />
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={npUnitId}
                    onChange={(e) => {
                      setNpUnitId(e.target.value);
                    }}
                    aria-label="unit"
                    className={fieldClass}
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={npPrice}
                    onChange={(e) => {
                      setNpPrice(e.target.value);
                    }}
                    placeholder="price"
                    aria-label="new product price"
                    className={fieldClass}
                  />
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={npQty}
                    onChange={(e) => {
                      setNpQty(e.target.value);
                    }}
                    placeholder="pack qty"
                    aria-label="new product pack quantity"
                    className={fieldClass}
                  />
                </div>
                {npError != null && (
                  <div className="text-[11px]" style={{ color: c.red }}>
                    {npError}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    void createProduct();
                  }}
                  disabled={npSaving}
                  className="rounded px-2 py-1 text-[12px] font-semibold disabled:opacity-50"
                  style={{ backgroundColor: c.aqua, color: c.bg0 }}
                >
                  {npSaving ? "saving…" : "create product"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowNewProduct(true);
                }}
                className="mt-2 flex items-center gap-1 rounded px-1 py-1 text-[12px] hover:bg-[#343f44]"
                style={{ color: c.aqua }}
              >
                <PlusIcon className="h-3.5 w-3.5" />
                new product
              </button>
            )}
          </div>
        )}
      </div>

      <div className="border-t" style={{ borderColor: c.bg3, backgroundColor: c.bg1 }}>
        {error != null && (
          <div className="px-3 py-1 text-[12px]" style={{ color: c.red }}>
            {error}
          </div>
        )}
        <div className="flex items-center justify-between px-3 py-1.5">
          <span className="text-[11px]" style={{ color: c.grey0 }}>
            ⌘⏎ save · esc cancel
          </span>
          <div className="flex items-center gap-3">
            <span className="text-[12px]" style={{ color: c.grey }}>
              total <span style={{ color: c.yellow }}>${total.toFixed(2)}</span>
            </span>
            <button
              type="button"
              onClick={submit}
              disabled={isPending}
              className="rounded px-3 py-1 text-[12px] font-semibold disabled:opacity-50"
              style={{ backgroundColor: c.green, color: c.bg0 }}
            >
              {isPending ? "saving…" : "save"}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ── tree ────────────────────────────────────────────────────────────────────

type Selection =
  | { kind: "invoice"; provider: ProviderNode; invoice: TreeInvoice }
  | { kind: "product"; provider: ProviderNode; product: TreeProduct };

export function ProviderTree({
  providers,
  units,
}: {
  providers: ProviderNode[];
  units: Unit[];
}): ReactElement {
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Selection | null>(null);
  const [adding, setAdding] = useState(false);
  const router = useRouter();

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
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        if (adding) setAdding(false);
        else if (selected != null) setSelected(null);
        return;
      }
      // "A" opens the add-invoice editor — vim-style, ignored while typing.
      if ((e.key === "a" || e.key === "A") && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (document.activeElement?.tagName ?? "").toLowerCase();
        if (tag === "input" || tag === "textarea" || tag === "select") return;
        if (adding) return;
        e.preventDefault();
        setSelected(null);
        setAdding(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return (): void => {
      window.removeEventListener("keydown", onKey);
    };
  }, [adding, selected]);

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
          <button
            type="button"
            onClick={() => {
              setSelected(null);
              setAdding(true);
            }}
            title="add invoice (A)"
            aria-label="add invoice"
            className="flex items-center gap-1 rounded px-1.5 py-1 hover:bg-[#3d484d]"
            style={{ color: c.green }}
          >
            <PlusIcon className="h-4 w-4" />
            <span className="text-[11px]">invoice</span>
            <kbd className="rounded px-1 text-[10px]" style={{ backgroundColor: c.bg3, color: c.grey }}>
              A
            </kbd>
          </button>
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
                          provider.products.map((product) => {
                            const productSelected =
                              selected?.kind === "product" &&
                              selected.product.productId === product.productId &&
                              selected.provider.id === provider.id;
                            return (
                              <Row
                                key={product.productId}
                                depth={2}
                                icon={CubeIcon}
                                iconColor={productSelected ? c.yellow : c.fg}
                                label={
                                  <span style={{ color: productSelected ? c.yellow : c.fg }}>
                                    {product.name}
                                  </span>
                                }
                                meta={
                                  <>
                                    <Money value={product.price} /> /{product.unit}
                                  </>
                                }
                                onOpen={() => {
                                  setSelected({ kind: "product", provider, product });
                                }}
                              />
                            );
                          })
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
                            const isSelected =
                              selected?.kind === "invoice" && selected.invoice.id === invoice.id;
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
                                    setSelected({ kind: "invoice", provider, invoice });
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

        {adding ? (
          <AddInvoicePanel
            providers={providers}
            units={units}
            onClose={() => {
              setAdding(false);
            }}
            onCreated={() => {
              setAdding(false);
              router.refresh();
            }}
          />
        ) : selected != null ? (
          selected.kind === "invoice" ? (
            <InvoicePanel
              provider={selected.provider}
              invoice={selected.invoice}
              onClose={() => {
                setSelected(null);
              }}
            />
          ) : (
            <ProductPanel
              key={`${selected.provider.id}:${selected.product.productId}`}
              provider={selected.provider}
              product={selected.product}
              onClose={() => {
                setSelected(null);
              }}
            />
          )
        ) : null}
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
