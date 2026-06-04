import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormMessage } from "@/components/form-feedback";

describe("FormMessage", () => {
  it("does not render without a message", () => {
    const { container } = render(<FormMessage message={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders error and success messages", () => {
    const { rerender } = render(<FormMessage message="No se pudo guardar." />);
    expect(screen.getByText("No se pudo guardar.")).toBeInTheDocument();

    rerender(<FormMessage message="Guardado." tone="success" />);
    expect(screen.getByText("Guardado.")).toBeInTheDocument();
  });
});
