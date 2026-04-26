import { Suspense } from "react";

import { SuspenseFallback } from "@/components/shared/suspense-fallback";

import { SecurityPolicyClient } from "./security-policy-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Política de Segurança — Gestão de Acesso",
};

export default function AdminGestaoAcessosSegurancaPage() {
  return (
    <Suspense fallback={<SuspenseFallback variant="section" />}>
      <SecurityPolicyClient />
    </Suspense>
  );
}
