"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function AppBoundaryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-destructive/20 bg-destructive/5 p-4">
      <ErrorState error={error} reset={reset} title="Falha no Módulo" />
    </div>
  );
}
