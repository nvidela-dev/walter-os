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
  it("defaults to the unpaid tab and shows its empty state", () => {
    render(<InvoiceList invoices={[]} />);
    expect(screen.getByText("No hay facturas pendientes.")).toBeInTheDocument();
  });

  it("offers a create prompt on the empty Unpaid and All tabs", async () => {
    const user = userEvent.setup();
    render(<InvoiceList invoices={[]} />);

    // Default Unpaid tab.
    expect(screen.getByRole("link", { name: /Nueva factura/ })).toHaveAttribute(
      "href",
      "/invoices/new"
    );

    await user.click(screen.getByRole("button", { name: /Todas/ }));
    expect(screen.getByRole("link", { name: /Nueva factura/ })).toBeInTheDocument();
  });

  it("shows no create prompt on the empty Paid or Overdue tabs", async () => {
    const user = userEvent.setup();
    render(<InvoiceList invoices={[]} />);

    await user.click(screen.getByRole("button", { name: /Pagadas/ }));
    expect(screen.queryByRole("link", { name: /Nueva factura/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Vencidas/ }));
    expect(screen.queryByRole("link", { name: /Nueva factura/ })).not.toBeInTheDocument();
  });

  it("keeps the create prompt on Unpaid even when all bills are paid", async () => {
    const user = userEvent.setup();
    render(<InvoiceList invoices={[{ ...baseInvoice, paid: true }]} />);

    // Default Unpaid tab is empty because the only bill is paid.
    expect(screen.getByRole("link", { name: /Nueva factura/ })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Pagadas/ }));
    expect(screen.getByText("Proveedor Uno")).toBeInTheDocument();
  });

  it("filters paid and unpaid empty states", async () => {
    const user = userEvent.setup();
    render(<InvoiceList invoices={[baseInvoice]} />);

    await user.click(screen.getByRole("button", { name: /Pagadas/ }));
    expect(screen.getByText("No hay facturas pagadas.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Pendientes/ }));
    expect(screen.getByText("Proveedor Uno")).toBeInTheDocument();
  });

  it("asks for confirmation before paying, then reverts when the action fails", async () => {
    const user = userEvent.setup();
    const togglePaidAction = vi.fn(async () => actionError("No se pudo actualizar."));

    render(<InvoiceList invoices={[baseInvoice]} togglePaidAction={togglePaidAction} />);

    await user.click(screen.getByRole("button", { name: "Pagar" }));
    // Confirmation screen reviews the bill details before committing: the
    // total shows both in the row and again in the review dialog.
    expect(screen.getByText("Confirmar pago")).toBeInTheDocument();
    expect(screen.getAllByText("$120.00")).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(await screen.findByText("No se pudo actualizar.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pagar" })).toBeInTheDocument();
    expect(togglePaidAction).toHaveBeenCalledWith(baseInvoice.id);
  });

  it("marks the bill paid after confirming", async () => {
    const user = userEvent.setup();
    render(
      <InvoiceList
        invoices={[baseInvoice]}
        togglePaidAction={async () => actionOk({ paid: true })}
      />
    );

    await user.click(screen.getByRole("button", { name: "Pagar" }));
    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(await screen.findByText("Pagada")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Marcar como pendiente" })).toBeInTheDocument();
  });

  it("does not pay when the confirmation is cancelled", async () => {
    const user = userEvent.setup();
    const togglePaidAction = vi.fn(async () => actionOk({ paid: true }));

    render(<InvoiceList invoices={[baseInvoice]} togglePaidAction={togglePaidAction} />);

    await user.click(screen.getByRole("button", { name: "Pagar" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(togglePaidAction).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Pagar" })).toBeInTheDocument();
  });

  it("shows the overdue badge for unpaid overdue bills", () => {
    render(<InvoiceList invoices={[{ ...baseInvoice, overdue: true }]} />);
    expect(screen.getByText("Vencida")).toBeInTheDocument();
  });

  it("hides the overdue badge once the bill is paid", async () => {
    const user = userEvent.setup();
    render(<InvoiceList invoices={[{ ...baseInvoice, overdue: true, paid: true }]} />);

    await user.click(screen.getByRole("button", { name: /Pagadas/ }));
    expect(screen.getByText("Proveedor Uno")).toBeInTheDocument();
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
    expect(await screen.findByText("No hay facturas pendientes.")).toBeInTheDocument();
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
