"use client";

import dynamic from "next/dynamic";

const RetencaoCohortContent = dynamic(
  () => import("./retencao-cohort-content"),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <div className="h-12 animate-pulse rounded-xl border border-border bg-card/60" />
        <div className="h-96 animate-pulse rounded-xl border border-border bg-card/60" />
      </div>
    ),
  },
);

export default function RetencaoCohortPage() {
  return <RetencaoCohortContent />;
}
