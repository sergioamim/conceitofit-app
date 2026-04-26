import { Suspense } from "react";

import { SuspenseFallback } from "@/components/shared/suspense-fallback";

import { AuditClient } from "./audit-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Auditoria — Gestão de Acesso",
};

export default function AdminGestaoAcessosAuditoriaPage() {
  return (
    <Suspense fallback={<SuspenseFallback variant="section" />}>
      <AuditClient />
    </Suspense>
  );
}
