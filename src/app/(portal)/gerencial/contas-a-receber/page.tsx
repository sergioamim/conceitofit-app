import { Suspense } from "react";
import { ContasAReceberContent } from "./contas-a-receber-content";

export default function ContasAReceberPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">Carregando...</div>}>
      <ContasAReceberContent />
    </Suspense>
  );
}
