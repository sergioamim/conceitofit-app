import { Suspense } from "react";

import { SuspenseFallback } from "@/components/shared/suspense-fallback";

import { InviteClient } from "./invite-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Convidar — Gestão de Acesso",
};

export default function PortalGestaoAcessosConvidarPage() {
  return (
    <Suspense fallback={<SuspenseFallback variant="section" />}>
      <InviteClient />
    </Suspense>
  );
}
