"use client";

import Link from "next/link";
import { type ReactElement, useState } from "react";

import { Select } from "@/components/ui/select";
import { t } from "@/i18n";
import { groupInventoryPurchases, type PurchaseProduct, selectedPurchaseSupplier } from "@/lib/inventory/purchases";

export function PurchaseList({ products }: { products: PurchaseProduct[] }): ReactElement {
  const [choices, setChoices] = useState<Record<string, string>>({});
  const grouped = groupInventoryPurchases(products, choices);
  function supplierChoice(product: PurchaseProduct): ReactElement | null {
    if (product.suppliers.length < 2 || product.comparison.shortage === null || product.comparison.shortage === "0") return null;
    return <label className="block text-sm">{t.inventoryPurchases.supplierFor(product.name)}
      <Select value={selectedPurchaseSupplier(product, choices)?.id ?? ""} onChange={(event) => { setChoices({ ...choices, [product.id]: event.target.value }); }}>
        <option value="">{t.inventoryPurchases.chooseSupplier}</option>
        {product.suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
      </Select>
    </label>;
  }
  function productLink(product: PurchaseProduct): ReactElement {
    return <Link href={`/inventory/items/${product.id}`} className="font-medium underline">{product.name}</Link>;
  }
  return <div className="space-y-5">
    {products.length === 0 && <p>{t.inventoryPurchases.noProducts}</p>}
    {grouped.groups.map(({ supplier, products: lines }) => <section key={supplier.id} className="app-card space-y-3 rounded-2xl p-5">
      <h2 className="text-lg font-semibold">{supplier.name}</h2>
      <ul className="divide-y">{lines.map((product) => <li key={product.id} className="space-y-2 py-3">
        <div className="flex flex-wrap justify-between gap-2">{productLink(product)}<span>{t.inventoryPurchases.buy(product.comparison.shortage ?? "", product.unit)}</span></div>
        <p className="text-sm text-muted">{t.inventoryPurchases.comparison(product.comparison.stock ?? "", product.comparison.target ?? "", product.unit)}</p>
        {supplierChoice(product)}
      </li>)}</ul>
    </section>)}
    {grouped.unresolved.length > 0 && <section className="app-card space-y-3 rounded-2xl p-5">
      <h2 className="text-lg font-semibold">{t.inventoryPurchases.unresolved(grouped.unresolved.length)}</h2>
      <p className="text-sm text-muted">{t.inventoryPurchases.unresolvedHint}</p>
      <ul className="divide-y">{grouped.unresolved.map((product) => <li key={product.id} className="space-y-2 py-3">
        {productLink(product)}
        {product.comparison.issues.map((issue) => <p className="text-sm" key={issue}>{t.inventoryPurchases.issues[issue]}</p>)}
        {product.comparison.shortage !== null && <>
          <p>{t.inventoryPurchases.buy(product.comparison.shortage, product.unit)}</p>
          <p className="text-sm text-muted">{t.inventoryPurchases.comparison(product.comparison.stock ?? "", product.comparison.target ?? "", product.unit)}</p>
          {product.suppliers.length === 0 ? <p className="text-sm">{t.inventoryPurchases.noSupplier}</p> : <p className="text-sm">{t.inventoryPurchases.chooseSupplier}</p>}
          {supplierChoice(product)}
        </>}
      </li>)}</ul>
    </section>}
    {grouped.noPurchase.length > 0 && <details className="app-card rounded-2xl p-5">
      <summary className="cursor-pointer font-medium">{t.inventoryPurchases.noPurchase(grouped.noPurchase.length)}</summary>
      <ul className="mt-3 space-y-3">{grouped.noPurchase.map((product) => <li key={product.id}>
        {productLink(product)}<p className="text-sm text-muted">{t.inventoryPurchases.comparison(product.comparison.stock ?? "", product.comparison.target ?? "", product.unit)}</p>
      </li>)}</ul>
    </details>}
    {products.some((product) => product.suppliers.length > 1) && <p className="text-xs text-muted">{t.inventoryPurchases.selectionHint}</p>}
  </div>;
}
