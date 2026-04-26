import { Suspense } from "react";

import { SuspenseFallback } from "@/components/shared/suspense-fallback";

import { RbacOverviewClient } from "./overview-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gestão de Acesso",
};

export default function PortalGestaoAcessosOverviewPage() {
  return (
    <Suspense fallback={<SuspenseFallback variant="section" />}>
      <RbacOverviewClient />
    </Suspense>
  );
}
