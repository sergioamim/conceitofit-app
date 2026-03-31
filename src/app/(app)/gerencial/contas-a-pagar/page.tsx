import { Suspense } from "react";
import { ContasPagarPageContent } from "./contas-a-pagar-content";

export default function ContasPagarPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">Carregando...</div>}>
      <ContasPagarPageContent />
    </Suspense>
  );
}
