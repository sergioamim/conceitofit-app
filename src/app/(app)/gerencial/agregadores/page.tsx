import { Suspense } from "react";
import { AgregadoresContent } from "./agregadores-content";

export default function AgregadoresPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">Carregando...</div>}>
      <AgregadoresContent />
    </Suspense>
  );
}
