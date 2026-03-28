"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CheckoutRedirect() {
  const searchParams = useSearchParams();
  const params = new URLSearchParams();
  searchParams.forEach((value, key) => params.set(key, value));

  if (typeof window !== "undefined") {
    window.location.replace(`/adesao/checkout?${params.toString()}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
      Redirecionando para pagamento...
    </div>
  );
}

export default function StorefrontCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
          Carregando...
        </div>
      }
    >
      <CheckoutRedirect />
    </Suspense>
  );
}
