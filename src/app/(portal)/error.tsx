"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { ErrorState } from "@/components/shared/error-state";

/**
 * Redirects e notFound() do Next não são erros — re-lançamos pra que o
 * framework processe corretamente. Sem isso o boundary renderiza
 * "NEXT_REDIRECT" como texto literal.
 */
function isControlFlowException(error: Error & { digest?: string }): boolean {
  const digest = error.digest ?? "";
  const message = error.message ?? "";
  return (
    digest.startsWith("NEXT_REDIRECT") ||
    digest.startsWith("NEXT_NOT_FOUND") ||
    message === "NEXT_REDIRECT" ||
    message === "NEXT_NOT_FOUND"
  );
}

export default function AppBoundaryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isControlFlow = isControlFlowException(error);

  useEffect(() => {
    if (isControlFlow) return;
    Sentry.captureException(error, {
      tags: { boundary: "app" },
    });
  }, [error, isControlFlow]);

  if (isControlFlow) {
    return null;
  }

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-dashed border-destructive/20 bg-destructive/5 shadow-sm">
        <ErrorState error={error} reset={reset} title="Falha no módulo" />
      </div>
    </div>
  );
}
