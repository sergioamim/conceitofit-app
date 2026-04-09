import { Suspense } from "react";
import { FidelizacaoContent } from "./fidelizacao-content";

export const dynamic = "force-dynamic";

export default function FidelizacaoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
          Carregando...
        </div>
      }
    >
      <FidelizacaoContent />
    </Suspense>
  );
}
