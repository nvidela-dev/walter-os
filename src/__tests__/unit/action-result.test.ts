import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import {
  actionError,
  actionOk,
  expectedActionError,
  unknownActionError,
  validationActionError,
} from "@/lib/action-result";

describe("action result primitives", () => {
  it("represents successful and failed actions", () => {
    expect(actionOk({ id: "1" })).toEqual({ ok: true, data: { id: "1" } });
    expect(actionError("No se pudo guardar.")).toEqual({
      ok: false,
      error: "No se pudo guardar.",
    });
  });

  it("keeps Zod field errors structured", () => {
    const schema = z.object({ nombre: z.string().min(1) });
    const parsed = schema.safeParse({ nombre: "" });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(validationActionError(parsed.error)).toMatchObject({
        ok: false,
        error: "Revisá los datos ingresados.",
        fieldErrors: { nombre: expect.any(Array) },
      });
    }
  });

  it("preserves expected business errors", () => {
    expect(unknownActionError(expectedActionError("Registro en uso."))).toEqual({
      ok: false,
      error: "Registro en uso.",
    });
  });

  it("logs unknown errors and returns the generic fallback", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(unknownActionError(new Error("database exploded"))).toEqual({
      ok: false,
      error: "No se pudo completar la acción.",
    });
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });
});
