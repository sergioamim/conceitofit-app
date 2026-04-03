import { Suspense } from "react";
import { CatracaStatusContent } from "./catraca-status-content";

export default function CatracaStatusPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">Carregando...</div>}>
      <CatracaStatusContent />
    </Suspense>
  );
}
