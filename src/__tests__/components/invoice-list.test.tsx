import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { actionError, actionOk } from "@/lib/action-result";

vi.mock("@/lib/actions/invoices", () => ({
  togglePaid: vi.fn(),
  deleteInvoice: vi.fn(),
}));

import { InvoiceList } from "@/app/invoices/invoice-list";

const baseInvoice = {
  id: "5ac23a65-cc36-410d-a92d-5c84944d638c",
  providerId: "d46ea49c-1eb9-44f6-923a-e82f7a46ae3b",
  providerName: "Proveedor Uno",
  date: "2026-06-03",
  number: "A-1",
  total: "120.00",
  paid: false,
  overdue: false,
};

describe("InvoiceList", () => {
  it("renders the list empty state", () => {
    render(<InvoiceList invoices={[]} />);
    expect(screen.getByText("Sin facturas.")).toBeInTheDocument();
  });

  it("filters paid and unpaid empty states", async () => {
    const user = userEvent.setup();
    render(<InvoiceList invoices={[baseInvoice]} />);

    await user.click(screen.getByRole("button", { name: /Pagadas/ }));
    expect(screen.getByText("No hay facturas pagadas.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Pendientes/ }));
    expect(screen.getByText("Proveedor Uno")).toBeInTheDocument();
  });

  it("reverts optimistic paid state when the action fails", async () => {
    const user = userEvent.setup();
    const togglePaidAction = vi.fn(async () => actionError("No se pudo actualizar."));

    render(<InvoiceList invoices={[baseInvoice]} togglePaidAction={togglePaidAction} />);

    await user.click(screen.getByRole("button", { name: "Marcar como pagada" }));

    expect(await screen.findByText("No se pudo actualizar.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Marcar como pagada" })).toBeInTheDocument();
    expect(togglePaidAction).toHaveBeenCalledWith(baseInvoice.id);
  });

  it("keeps optimistic paid state when the action succeeds", async () => {
    const user = userEvent.setup();
    render(
      <InvoiceList
        invoices={[baseInvoice]}
        togglePaidAction={async () => actionOk({ paid: true })}
      />
    );

    await user.click(screen.getByRole("button", { name: "Marcar como pagada" }));

    expect(screen.getByRole("button", { name: "Marcar como pendiente" })).toBeInTheDocument();
  });

  it("shows the overdue badge only for unpaid overdue bills", () => {
    render(<InvoiceList invoices={[{ ...baseInvoice, overdue: true }]} />);
    expect(screen.getByText("Vencida")).toBeInTheDocument();
  });

  it("hides the overdue badge once the bill is paid", () => {
    render(<InvoiceList invoices={[{ ...baseInvoice, overdue: true, paid: true }]} />);
    expect(screen.queryByText("Vencida")).not.toBeInTheDocument();
  });

  it("filters to overdue bills", async () => {
    const user = userEvent.setup();
    render(
      <InvoiceList
        invoices={[
          { ...baseInvoice, id: "11111111-1111-4111-8111-111111111111", overdue: false },
          {
            ...baseInvoice,
            id: "22222222-2222-4222-8222-222222222222",
            providerName: "Proveedor Vencido",
            overdue: true,
          },
        ]}
      />
    );

    await user.click(screen.getByRole("button", { name: /Vencidas/ }));
    expect(screen.getByText("Proveedor Vencido")).toBeInTheDocument();
    expect(screen.queryByText("Proveedor Uno")).not.toBeInTheDocument();
  });

  it("removes a row after a successful delete", async () => {
    const user = userEvent.setup();
    const deleteInvoiceAction = vi.fn(async () => actionOk(undefined));

    render(<InvoiceList invoices={[baseInvoice]} deleteInvoiceAction={deleteInvoiceAction} />);

    await user.click(screen.getByRole("button", { name: "Eliminar factura" }));
    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(deleteInvoiceAction).toHaveBeenCalledWith(baseInvoice.id);
    expect(await screen.findByText("Sin facturas.")).toBeInTheDocument();
  });

  it("keeps the row and shows the error when delete is blocked", async () => {
    const user = userEvent.setup();
    const deleteInvoiceAction = vi.fn(async () => actionError("No se puede eliminar."));

    render(<InvoiceList invoices={[baseInvoice]} deleteInvoiceAction={deleteInvoiceAction} />);

    await user.click(screen.getByRole("button", { name: "Eliminar factura" }));
    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(await screen.findByText("No se puede eliminar.")).toBeInTheDocument();
    expect(screen.getByText("Proveedor Uno")).toBeInTheDocument();
  });
});
