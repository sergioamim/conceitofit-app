"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SuspenseFallback } from "@/components/shared/suspense-fallback";

function CheckoutRedirect() {
  const searchParams = useSearchParams();
  const params = new URLSearchParams();
  searchParams.forEach((value, key) => params.set(key, value));

  if (typeof window !== "undefined") {
    window.location.replace(`/adesao/checkout?${params.toString()}`);
  }

  return (
    <SuspenseFallback variant="page" message="Carregando jornada pública..." />
      Redirecionando para pagamento...
    </div>
  );
}

export default function StorefrontCheckoutPage() {
  return (
    <Suspense
      fallback={
        <SuspenseFallback variant="page" message="Carregando jornada pública..." />
          Carregando...
        </div>
      }
    >
      <CheckoutRedirect />
    </Suspense>
  );
}
