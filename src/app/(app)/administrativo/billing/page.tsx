import { Suspense } from "react";
import { BillingConfigContent } from "./billing-config-content";

export default function BillingConfigPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
          Carregando configuração de cobrança...
        </div>
      }
    >
      <BillingConfigContent />
    </Suspense>
  );
}
