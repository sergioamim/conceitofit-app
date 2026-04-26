/**
 * Lista de Usuários do RBAC v2 (story #6).
 */

import { Suspense } from "react";

import { SuspenseFallback } from "@/components/shared/suspense-fallback";

import { UsersListClient } from "./users-list-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Usuários — Gestão de Acesso",
};

export default function AdminGestaoAcessosUsuariosPage() {
  return (
    <Suspense fallback={<SuspenseFallback variant="section" />}>
      <UsersListClient />
    </Suspense>
  );
}
