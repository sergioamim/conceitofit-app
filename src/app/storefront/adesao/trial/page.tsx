"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function TrialRedirect() {
  const searchParams = useSearchParams();
  const params = new URLSearchParams();
  searchParams.forEach((value, key) => params.set(key, value));

  if (typeof window !== "undefined") {
    window.location.replace(`/adesao/trial?${params.toString()}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
      Redirecionando para aula experimental...
    </div>
  );
}

export default function StorefrontTrialPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
          Carregando...
        </div>
      }
    >
      <TrialRedirect />
    </Suspense>
  );
}
