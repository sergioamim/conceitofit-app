import { Suspense } from "react";
import { AcademiaContent } from "./academia-content";

export default function AcademiaPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">Carregando...</div>}>
      <AcademiaContent />
    </Suspense>
  );
}
