"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[80vh] w-full flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-destructive/15 bg-card/80 shadow-lg">
        <ErrorState error={error} reset={reset} title="Falha geral da aplicação" />
      </div>
    </div>
  );
}
