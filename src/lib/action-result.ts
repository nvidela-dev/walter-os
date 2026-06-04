import { flattenError, ZodError } from "zod";

import { t } from "@/i18n";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export function actionOk<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function actionError(
  error: string,
  fieldErrors?: Record<string, string[]>
): ActionResult<never> {
  return fieldErrors ? { ok: false, error, fieldErrors } : { ok: false, error };
}

export function validationActionError(error: ZodError): ActionResult<never> {
  return actionError(t.errors.invalidInput, flattenError(error).fieldErrors);
}

export class ExpectedActionError extends Error {}

export function expectedActionError(message: string): ExpectedActionError {
  return new ExpectedActionError(message);
}

export function unknownActionError(
  error: unknown,
  fallback = t.errors.generic
): ActionResult<never> {
  if (error instanceof ZodError) {
    return validationActionError(error);
  }
  if (error instanceof ExpectedActionError) {
    return actionError(error.message);
  }
  console.error(error);
  return actionError(fallback);
}

export function getActionError(
  result: ActionResult<unknown>,
  fallback = t.errors.generic
): string | null {
  return result.ok ? null : result.error || fallback;
}
