import { Suspense } from "react";
import { GradeContent } from "./grade-content";

export default function GradePage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">Carregando...</div>}>
      <GradeContent />
    </Suspense>
  );
}
