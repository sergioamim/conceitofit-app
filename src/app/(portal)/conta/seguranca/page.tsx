import { Suspense } from "react";
import { SegurancaContent } from "./seguranca-content";

export default function SegurancaPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">Carregando...</div>}>
      <SegurancaContent />
    </Suspense>
  );
}
