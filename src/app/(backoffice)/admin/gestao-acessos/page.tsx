/**
 * Visão Geral do RBAC — primeira tela do redesign (story #5).
 *
 * Monta o feature module RBAC v2 no contexto ACADEMIA (operadores da rede ativa).
 */

import { Suspense } from "react";

import { SuspenseFallback } from "@/components/shared/suspense-fallback";

import { RbacOverviewClient } from "./overview-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gestão de Acesso — Backoffice",
};

export default function AdminGestaoAcessosOverviewPage() {
  return (
    <Suspense fallback={<SuspenseFallback variant="section" />}>
      <RbacOverviewClient />
    </Suspense>
  );
}
