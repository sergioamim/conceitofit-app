import { Suspense } from "react";
import { DunningContent } from "./dunning-content";

export const dynamic = "force-dynamic";

export default function DunningPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
          Carregando...
        </div>
      }
    >
      <DunningContent />
    </Suspense>
  );
}
