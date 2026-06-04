import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { actionError, actionOk } from "@/lib/action-result";

vi.mock("@/app/invoices/actions", () => ({
  togglePaid: vi.fn(),
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
});
