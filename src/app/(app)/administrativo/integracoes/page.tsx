import { Suspense } from "react";
import { IntegracoesContent } from "./integracoes-content";

export default function IntegracoesPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">Carregando...</div>}>
      <IntegracoesContent />
    </Suspense>
  );
}
