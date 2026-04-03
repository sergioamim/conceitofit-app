import { Suspense } from "react";
import { NotificacoesContent } from "./notificacoes-content";

export default function NotificacoesPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">Carregando...</div>}>
      <NotificacoesContent />
    </Suspense>
  );
}
