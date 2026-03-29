import { Suspense } from "react";
import { IaContent } from "./ia-content";

export default function AdministrativoIaPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">Carregando...</div>}>
      <IaContent />
    </Suspense>
  );
}
