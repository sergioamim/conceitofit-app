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
    <div className="flex min-h-[80vh] w-full flex-col items-center justify-center p-4">
      <ErrorState error={error} reset={reset} />
    </div>
  );
}
