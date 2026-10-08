import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";

import { InventoryProgress } from "@/app/inventory/progress";

it("distinguishes incomplete, fully counted, and empty fridges", () => {
  const view = render(<InventoryProgress counted={1} total={2} />);
  expect(screen.getByText("1 de 2 productos contados · 1 sin revisar")).toBeInTheDocument();
  view.rerender(<InventoryProgress counted={2} total={2} />);
  expect(screen.getByText("Todos los productos contados (2).")).toBeInTheDocument();
  view.rerender(<InventoryProgress counted={0} total={0} />);
  expect(screen.getByText("Agregá productos para empezar a contar.")).toBeInTheDocument();
  expect(screen.queryByText(/Todos los productos contados/)).not.toBeInTheDocument();
});
