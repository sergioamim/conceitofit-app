import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: {
    default: "Backoffice — Conceito Fit",
    template: "%s — Backoffice Conceito Fit",
  },
  description:
    "Painel administrativo do Conceito Fit — gestão de academias, unidades, financeiro e operação SaaS.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

function BackofficeFallback() {
  return (
    <div role="status" aria-live="polite" className="min-h-screen bg-background p-6">
      <span className="sr-only">Carregando backoffice…</span>
      <div className="mx-auto max-w-6xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function BackofficeLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<BackofficeFallback />}>{children}</Suspense>;
}
