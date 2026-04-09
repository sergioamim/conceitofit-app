import { Suspense } from "react";
import { DunningTemplatesContent } from "./templates-content";

export const dynamic = "force-dynamic";

export default function DunningTemplatesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
          Carregando...
        </div>
      }
    >
      <DunningTemplatesContent />
    </Suspense>
  );
}
