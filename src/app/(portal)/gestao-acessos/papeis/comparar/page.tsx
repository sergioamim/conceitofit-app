import { Suspense } from "react";

import { SuspenseFallback } from "@/components/shared/suspense-fallback";

import { CompareClient } from "./compare-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Comparar papéis — Gestão de Acesso",
};

export default function PortalGestaoAcessosCompararPage() {
  return (
    <Suspense fallback={<SuspenseFallback variant="section" />}>
      <CompareClient />
    </Suspense>
  );
}
