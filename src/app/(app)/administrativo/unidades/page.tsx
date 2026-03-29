import { Suspense } from "react";
import { UnidadesContent } from "./unidades-content";

export default function UnidadesPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">Carregando...</div>}>
      <UnidadesContent />
    </Suspense>
  );
}
