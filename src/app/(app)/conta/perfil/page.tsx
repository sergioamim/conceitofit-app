import { Suspense } from "react";
import { PerfilContent } from "./perfil-content";

export default function PerfilPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">Carregando...</div>}>
      <PerfilContent />
    </Suspense>
  );
}
