import { Suspense } from "react";
import { MaquininhasContent } from "./maquininhas-content";

export default function MaquininhasPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">Carregando...</div>}>
      <MaquininhasContent />
    </Suspense>
  );
}
