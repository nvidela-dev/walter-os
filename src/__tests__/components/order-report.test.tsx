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
  expect(await navigator.clipboard.readText()).toContain("Hola Proveedor A");
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
  await user.selectOptions(screen.getByRole("combobox"), "b");
  expect(screen.getByRole("checkbox")).not.toBeChecked();
  await user.click(screen.getByRole("checkbox"));
  await user.click(screen.getByRole("button", { name: "Confirmar y generar pedidos" }));
  const message = screen.getByRole<HTMLTextAreaElement>("textbox", { name: "Pedido para Proveedor B" }).value;
  expect(message).toContain("Agua: 8 botella");
  expect(message).not.toContain("Sin contar");
  expect(message).not.toContain("Completo");
});
