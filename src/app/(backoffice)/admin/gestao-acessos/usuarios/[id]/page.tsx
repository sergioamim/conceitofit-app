/**
 * Detalhe de Usuário do RBAC v2 (story #7).
 */

import { Suspense } from "react";

import { SuspenseFallback } from "@/components/shared/suspense-fallback";

import { UserDetailClient } from "./user-detail-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Usuário — Gestão de Acesso",
};

export default async function AdminGestaoAcessosUsuarioDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<SuspenseFallback variant="section" />}>
      <UserDetailClient id={id} />
    </Suspense>
  );
}
