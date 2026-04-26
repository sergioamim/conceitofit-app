/**
 * Wizard "Convidar usuário" do RBAC v2 (story #8).
 */

import { Suspense } from "react";

import { SuspenseFallback } from "@/components/shared/suspense-fallback";

import { InviteClient } from "./invite-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Convidar — Gestão de Acesso",
};

export default function AdminGestaoAcessosConvidarPage() {
  return (
    <Suspense fallback={<SuspenseFallback variant="section" />}>
      <InviteClient />
    </Suspense>
  );
}
