"use client";

import dynamic from "next/dynamic";

// Task 484: code splitting — lazy load heavy grade content
const GradeContent = dynamic(
  () => import("./grade-content").then((mod) => ({ default: mod.GradeContent })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        Carregando grade...
      </div>
    ),
  },
);

export default function GradePage() {
  return <GradeContent />;
}
