"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { ErrorState } from "@/components/shared/error-state";

export default function AppBoundaryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { boundary: "app" },
    });
  }, [error]);

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-dashed border-destructive/20 bg-destructive/5 shadow-sm">
        <ErrorState error={error} reset={reset} title="Falha no módulo" />
      </div>
    </div>
  );
}
