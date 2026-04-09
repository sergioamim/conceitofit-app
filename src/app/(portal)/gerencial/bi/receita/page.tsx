"use client";

import dynamic from "next/dynamic";

const ReceitaContent = dynamic(
  () => import("./receita-content"),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-xl border border-border bg-card/60" />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-xl border border-border bg-card/60" />
      </div>
    ),
  },
);

export default function ReceitaPage() {
  return <ReceitaContent />;
}
