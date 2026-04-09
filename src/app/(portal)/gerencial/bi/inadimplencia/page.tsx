"use client";

import dynamic from "next/dynamic";

const InadimplenciaContent = dynamic(
  () => import("./inadimplencia-content"),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-xl border border-border bg-card/60" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-xl border border-border bg-card/60" />
          ))}
        </div>
      </div>
    ),
  },
);

export default function InadimplenciaPage() {
  return <InadimplenciaContent />;
}
