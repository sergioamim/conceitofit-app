"use client";

import dynamic from "next/dynamic";

// Task 484: code splitting — lazy load heavy BI content (440 LOC)
const BiOperacionalContent = dynamic(
  () => import("./bi-content"),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-xl border border-border bg-card/60" />
          ))}
        </div>
      </div>
    ),
  },
);

export default function BiOperacionalPage() {
  return <BiOperacionalContent />;
}
