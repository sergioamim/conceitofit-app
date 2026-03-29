import { Suspense } from "react";
import { ProspectsKanbanContent } from "./prospects-kanban-content";

export default function ProspectsKanbanPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">Carregando...</div>}>
      <ProspectsKanbanContent />
    </Suspense>
  );
}
