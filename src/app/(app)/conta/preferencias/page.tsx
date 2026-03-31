import { Suspense } from "react";
import { PreferenciasContent } from "./preferencias-content";

export default function PreferenciasPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">Carregando...</div>}>
      <PreferenciasContent />
    </Suspense>
  );
}
