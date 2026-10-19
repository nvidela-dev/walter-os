import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";

import { OrderReport } from "@/components/order-report";
import type { PurchaseProduct } from "@/lib/inventory/purchases";

const product = (patch: Partial<PurchaseProduct> = {}): PurchaseProduct => ({ id: "one", name: "Agua", unit: "botella", comparison: { stock: "2", target: "10", shortage: "8", issues: [] }, suppliers: [{ id: "p", name: "Proveedor A" }], ...patch });
it("requires confirmation before exposing messages, copies the provider request, and resets review", async () => {
  const user = userEvent.setup();
  render(<OrderReport products={[product()]} label="Refrescos" date="2026-10-18" />);
  const generate = screen.getByRole("button", { name: "Confirmar y generar pedidos" });
  expect(generate).toBeDisabled();
  expect(screen.queryByRole("button", { name: "Copiar pedido" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("checkbox"));
  await user.click(generate);
  expect(screen.getByRole<HTMLTextAreaElement>("textbox", { name: "Pedido para Proveedor A" }).value).toContain("• Agua: 8 botella");
  await user.click(screen.getByRole("button", { name: "Copiar pedido" }));
  expect(await navigator.clipboard.readText()).toBe("• Agua: 8 botella");
  await user.click(screen.getByRole("button", { name: "Volver a revisar" }));
  expect(screen.getByRole("button", { name: "Confirmar y generar pedidos" })).toBeDisabled();
});
it("excludes missing counts and zero shortages and requires choosing an ambiguous provider", async () => {
  const user = userEvent.setup();
  render(<OrderReport products={[
    product({ suppliers: [{ id: "p", name: "Proveedor A" }, { id: "b", name: "Proveedor B" }] }),
    product({ id: "unknown", name: "Sin contar", comparison: { stock: null, target: "10", shortage: null, issues: ["missing-count"] } }),
    product({ id: "full", name: "Completo", comparison: { stock: "10", target: "10", shortage: "0", issues: [] } }),
  ]} label="Refrescos" date="2026-10-18" />);
  await user.click(screen.getByRole("checkbox"));
  expect(screen.getByRole("button", { name: "Confirmar y generar pedidos" })).toBeDisabled();
  await user.click(screen.getByText("Revisar pedido · Refrescos"));
  await user.selectOptions(screen.getByRole("combobox"), "b");
  expect(screen.getByRole("checkbox")).not.toBeChecked();
  await user.click(screen.getByRole("checkbox"));
  await user.click(screen.getByRole("button", { name: "Confirmar y generar pedidos" }));
  const message = screen.getByRole<HTMLTextAreaElement>("textbox", { name: "Pedido para Proveedor B" }).value;
  expect(message).toContain("Agua: 8 botella");
  expect(message).not.toContain("Sin contar");
  expect(message).not.toContain("Completo");
});

it("links missing suppliers to a focused provider queue before generating any orders", () => {
  render(<OrderReport products={[product({ id: "onion", name: "Cebolla picada", suppliers: [] })]} label="Alimentos" date="2026-10-13" />);
  expect(screen.getByRole("link", { name: "¿Quién lo trae? · Completar proveedores" })).toHaveAttribute("href", "/data-fill?products=onion");
});

it("separates internal production from purchases and copies only its resolved quantities", async () => {
  const user = userEvent.setup();
  const production = [{ id: "3e9af935-c777-4357-bf41-fa24a9c3949a", name: "Don juan" }];
  render(<OrderReport products={[
    product(),
    product({ id: "gnocchi", name: "Ñoquis", suppliers: production }),
    product({ id: "pending", name: "Sin objetivo", suppliers: production, comparison: { stock: "2", target: null, shortage: null, issues: ["missing-target"] } }),
    product({ id: "full", name: "Suficiente", suppliers: production, comparison: { stock: "10", target: "10", shortage: "0", issues: [] } }),
  ]} label="Alimentos" date="2026-10-19" />);
  expect(screen.queryByText("Don juan")).not.toBeInTheDocument();
  expect(screen.getByText(/1 proveedores · 1 productos para producción interna/)).toBeInTheDocument();
  await user.click(screen.getByRole("checkbox"));
  await user.click(screen.getByRole("button", { name: "Confirmar y generar pedidos" }));
  expect(screen.getAllByRole("button", { name: "Copiar pedido" })).toHaveLength(1);
  expect(screen.getByRole("region", { name: "Producción interna" })).toBeInTheDocument();
  expect(screen.getByRole<HTMLTextAreaElement>("textbox", { name: "Lista de producción" }).value).toBe("Producción interna\n• Ñoquis: 8 botella");
  await user.click(screen.getByRole("button", { name: "Copiar producción" }));
  expect(await navigator.clipboard.readText()).toBe("Producción interna\n• Ñoquis: 8 botella");
  expect(screen.getByText("Lista de producción copiada.")).toBeInTheDocument();
  expect(screen.getByText(/Fuera de estos pedidos: Sin objetivo/)).toBeInTheDocument();
});

it("generates an internal production list even when there are no external purchases", async () => {
  const user = userEvent.setup();
  render(<OrderReport products={[product({ suppliers: [{ id: "3e9af935-c777-4357-bf41-fa24a9c3949a", name: "Don juan" }] })]} label="Alimentos" date="2026-10-19" />);
  await user.click(screen.getByRole("checkbox"));
  await user.click(screen.getByRole("button", { name: "Confirmar y generar pedidos" }));
  expect(screen.getByRole("button", { name: "Copiar producción" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Copiar pedido" })).not.toBeInTheDocument();
});


it("keeps review collapsed and places confirmation controls before the expandable section", async () => {
  const user = userEvent.setup();
  render(<OrderReport products={[product()]} label="Alimentos" date="2026-10-19" />);
  const summary = screen.getByText("Revisar pedido · Alimentos");
  const details = summary.closest("details");
  expect(details).not.toHaveAttribute("open");
  expect(screen.getByRole("checkbox").compareDocumentPosition(summary) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.getByRole("button", { name: "Confirmar y generar pedidos" }).compareDocumentPosition(summary) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  await user.click(summary);
  expect(details).toHaveAttribute("open");
  expect(screen.getByText("Agua")).toBeVisible();
  await user.click(summary);
  expect(details).not.toHaveAttribute("open");
});
