import { Suspense } from "react";

import { SuspenseFallback } from "@/components/shared/suspense-fallback";

import { RolesListClient } from "./roles-list-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Papéis — Gestão de Acesso",
};

export default function PortalGestaoAcessosPapeisPage() {
  return (
    <Suspense fallback={<SuspenseFallback variant="section" />}>
      <RolesListClient />
    </Suspense>
  );
}
