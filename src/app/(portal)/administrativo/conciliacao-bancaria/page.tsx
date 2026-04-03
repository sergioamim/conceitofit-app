import { Suspense } from "react";
import { ConciliacaoBancariaContent } from "./conciliacao-bancaria-content";

export default function ConciliacaoBancariaPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">Carregando...</div>}>
      <ConciliacaoBancariaContent />
    </Suspense>
  );
}
