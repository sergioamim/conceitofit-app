import { Suspense } from "react";
import { AtividadesGradeContent } from "./atividades-grade-content";

export default function AtividadesGradePage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">Carregando...</div>}>
      <AtividadesGradeContent />
    </Suspense>
  );
}
