import { Suspense } from "react";

import { SuspenseFallback } from "@/components/shared/suspense-fallback";

import { NewRoleClient } from "./new-role-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Novo papel — Gestão de Acesso",
};

export default function PortalGestaoAcessosNovoPapelPage() {
  return (
    <Suspense fallback={<SuspenseFallback variant="section" />}>
      <NewRoleClient />
    </Suspense>
  );
}
