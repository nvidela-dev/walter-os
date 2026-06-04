import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DeleteButton } from "@/components/delete-button";
import { actionError, actionOk } from "@/lib/action-result";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("DeleteButton", () => {
  beforeEach(() => {
    push.mockClear();
  });

  it("confirms before deleting", async () => {
    const user = userEvent.setup();
    render(
      <DeleteButton
        id="provider-1"
        name="Proveedor"
        redirectTo="/providers"
        deleteAction={async () => actionOk(undefined)}
      />
    );

    await user.click(screen.getByRole("button", { name: "Eliminar Proveedor" }));

    expect(screen.getByRole("heading", { name: "¿Eliminar?" })).toBeInTheDocument();
    expect(screen.getByText(/Proveedor/)).toBeInTheDocument();
  });

  it("shows blocked delete errors and recovers pending state", async () => {
    const user = userEvent.setup();
    render(
      <DeleteButton
        id="provider-1"
        name="Proveedor"
        redirectTo="/providers"
        deleteAction={async () => actionError("No se puede eliminar este proveedor.")}
      />
    );

    await user.click(screen.getByRole("button", { name: "Eliminar Proveedor" }));
    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(await screen.findByText("No se puede eliminar este proveedor.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Eliminar" })).toBeEnabled();
    expect(push).not.toHaveBeenCalled();
  });

  it("redirects after successful deletion", async () => {
    const user = userEvent.setup();
    render(
      <DeleteButton
        id="provider-1"
        name="Proveedor"
        redirectTo="/providers"
        deleteAction={async () => actionOk(undefined)}
      />
    );

    await user.click(screen.getByRole("button", { name: "Eliminar Proveedor" }));
    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(push).toHaveBeenCalledWith("/providers");
  });
});
