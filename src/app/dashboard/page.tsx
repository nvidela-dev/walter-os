import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

import { getEmployees } from "@/app/employees/actions";
import { getInvoices, type InvoiceListRow } from "@/app/invoices/actions";
import { getMenuItems, type MenuItemRow } from "@/app/menu/actions";
import { getProviders, type ProviderListRow } from "@/app/providers/actions";
import { getRecipes } from "@/app/recipes/actions";
import type { Employee, Recipe } from "@/db/schema";

import { BoolBadge, type Column, DataTable, Money, ShortId } from "./data-table";

export const dynamic = "force-dynamic";

const providerColumns: Column<ProviderListRow>[] = [
  { key: "id", header: "id", mono: true, render: (r) => <ShortId id={r.id} /> },
  { key: "name", header: "name", render: (r) => r.name },
  {
    key: "type",
    header: "type",
    render: (r) => (
      <span className="rounded bg-slate-700/40 px-1.5 py-0.5 font-mono text-xs text-slate-300">
        {r.type}
      </span>
    ),
  },
  { key: "products", header: "products", align: "right", render: (r) => r.productCount },
  {
    key: "debt",
    header: "debt",
    align: "right",
    render: (r) =>
      Number(r.debt) > 0 ? (
        <span className="text-amber-400">
          <Money value={r.debt} />
        </span>
      ) : (
        <Money value={r.debt} />
      ),
  },
  { key: "days", header: "days", mono: true, render: (r) => r.days },
  { key: "description", header: "description", render: (r) => r.description },
];

const invoiceColumns: Column<InvoiceListRow>[] = [
  { key: "id", header: "id", mono: true, render: (r) => <ShortId id={r.id} /> },
  { key: "date", header: "date", mono: true, render: (r) => r.date },
  { key: "number", header: "number", mono: true, render: (r) => r.number },
  { key: "provider", header: "provider", render: (r) => r.providerName },
  { key: "total", header: "total", align: "right", render: (r) => <Money value={r.total} /> },
  {
    key: "paid",
    header: "paid",
    render: (r) => <BoolBadge value={r.paid} trueLabel="paid" falseLabel="unpaid" />,
  },
];

const employeeColumns: Column<Employee>[] = [
  { key: "id", header: "id", mono: true, render: (r) => <ShortId id={r.id} /> },
  { key: "name", header: "name", render: (r) => r.name },
  {
    key: "salary",
    header: "monthly_salary",
    align: "right",
    render: (r) => <Money value={r.monthlySalary} />,
  },
  {
    key: "hours",
    header: "weekly_hours",
    align: "right",
    render: (r) => r.fixedWeeklyHours,
  },
];

const recipeColumns: Column<Recipe>[] = [
  { key: "id", header: "id", mono: true, render: (r) => <ShortId id={r.id} /> },
  { key: "name", header: "name", render: (r) => r.name },
  { key: "description", header: "description", render: (r) => r.description },
];

const menuColumns: Column<MenuItemRow>[] = [
  { key: "id", header: "id", mono: true, render: (r) => <ShortId id={r.id} /> },
  { key: "name", header: "name", render: (r) => r.name },
  {
    key: "price",
    header: "sell_price",
    align: "right",
    render: (r) => <Money value={r.sellPrice} />,
  },
  { key: "recipe", header: "recipe", render: (r) => r.recipeName },
  { key: "description", header: "description", render: (r) => r.description },
];

export default async function DashboardPage(): Promise<ReactElement> {
  const [providers, invoices, employees, recipes, menuItems] = await Promise.all([
    getProviders(),
    getInvoices(),
    getEmployees(),
    getRecipes(),
    getMenuItems(),
  ]);

  const stats = [
    { label: "providers", count: providers.length },
    { label: "invoices", count: invoices.length },
    { label: "employees", count: employees.length },
    { label: "recipes", count: recipes.length },
    { label: "menu", count: menuItems.length },
  ];

  return (
    <div className="min-h-screen bg-slate-950 font-[family-name:var(--font-geist-mono)] text-slate-200">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              aria-label="back"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-800 text-slate-400 hover:bg-slate-800"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </Link>
            <span className="text-sm text-slate-400">
              <span className="text-slate-200">dashboard</span>
              <span className="mx-1.5 text-slate-600">/</span>
              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-xs text-emerald-400">
                superuser
              </span>
            </span>
          </div>
          <div className="flex gap-4 text-xs text-slate-500">
            {stats.map((s) => (
              <span key={s.label}>
                {s.label}
                <span className="ml-1 text-slate-300">{s.count}</span>
              </span>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-6 py-8">
        <Section name="providers" count={providers.length}>
          <DataTable columns={providerColumns} rows={providers} getRowKey={(r) => r.id} />
        </Section>
        <Section name="invoices" count={invoices.length}>
          <DataTable columns={invoiceColumns} rows={invoices} getRowKey={(r) => r.id} />
        </Section>
        <Section name="employees" count={employees.length}>
          <DataTable columns={employeeColumns} rows={employees} getRowKey={(r) => r.id} />
        </Section>
        <Section name="recipes" count={recipes.length}>
          <DataTable columns={recipeColumns} rows={recipes} getRowKey={(r) => r.id} />
        </Section>
        <Section name="menu" count={menuItems.length}>
          <DataTable columns={menuColumns} rows={menuItems} getRowKey={(r) => r.id} />
        </Section>
      </main>
    </div>
  );
}

function Section({
  name,
  count,
  children,
}: {
  name: string;
  count: number;
  children: ReactNode;
}): ReactElement {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline gap-2">
        <h2 className="text-sm font-medium text-slate-300">{name}</h2>
        <span className="text-xs text-slate-600">({count})</span>
      </div>
      {count === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-800 px-3 py-6 text-center text-xs text-slate-600">
          no rows
        </p>
      ) : (
        children
      )}
    </section>
  );
}
