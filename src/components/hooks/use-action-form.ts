"use client";

import { useCallback, useState } from "react";

import { t } from "@/i18n";
import { actionError, type ActionResult } from "@/lib/action-result";

export function useActionForm(fallback: string = t.errors.generic): {
  error: string | null;
  isSubmitting: boolean;
  clearError: () => void;
  setError: (message: string | null) => void;
  runAction: <T>(action: () => Promise<ActionResult<T>>) => Promise<ActionResult<T>>;
} {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const runAction = useCallback(
    async <T,>(action: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> => {
      setIsSubmitting(true);
      setError(null);
      try {
        const result = await action();
        if (!result.ok) setError(result.error);
        return result;
      } catch {
        const result: ActionResult<T> = actionError(fallback);
        setError(fallback);
        return result;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fallback]
  );

  return { error, isSubmitting, clearError, setError, runAction };
}
