import { Suspense } from "react";
import { AvaliacoesContent } from "./components/avaliacoes-content";
import { SuspenseFallback } from "@/components/shared/suspense-fallback";

export const dynamic = "force-dynamic";

export default function MinhasAvaliacoesPage() {
  return (
    <Suspense fallback={<SuspenseFallback variant="section" />}>
      <AvaliacoesContent />
    </Suspense>
  );
}
