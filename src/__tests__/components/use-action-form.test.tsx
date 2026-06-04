import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";

import { useActionForm } from "@/components/hooks/use-action-form";
import type { ActionResult } from "@/lib/action-result";

function ActionFormHarness({
  action,
}: {
  action: () => Promise<ActionResult>;
}): ReactElement {
  const { error, isSubmitting, runAction } = useActionForm("Falló la acción.");

  return (
    <div>
      <button type="button" disabled={isSubmitting} onClick={() => void runAction(action)}>
        Guardar
      </button>
      {error != null && error !== "" && <p>{error}</p>}
    </div>
  );
}

describe("useActionForm", () => {
  it("recovers the pending state when an action promise rejects", async () => {
    const user = userEvent.setup();
    render(<ActionFormHarness action={async () => Promise.reject(new Error("network"))} />);

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Falló la acción.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar" })).toBeEnabled();
  });
});
