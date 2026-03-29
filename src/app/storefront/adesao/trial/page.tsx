"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SuspenseFallback } from "@/components/shared/suspense-fallback";

function TrialRedirect() {
  const searchParams = useSearchParams();
  const params = new URLSearchParams();
  searchParams.forEach((value, key) => params.set(key, value));

  if (typeof window !== "undefined") {
    window.location.replace(`/adesao/trial?${params.toString()}`);
  }

  return (
    <SuspenseFallback variant="page" message="Carregando jornada pública..." />
      Redirecionando para aula experimental...
    </div>
  );
}

export default function StorefrontTrialPage() {
  return (
    <Suspense
      fallback={
        <SuspenseFallback variant="page" message="Carregando jornada pública..." />
          Carregando...
        </div>
      }
    >
      <TrialRedirect />
    </Suspense>
  );
}
