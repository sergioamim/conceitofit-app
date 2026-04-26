import { Suspense } from "react";

import { SuspenseFallback } from "@/components/shared/suspense-fallback";

import { PermissionsCatalogClient } from "./permissions-catalog-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Permissões — Gestão de Acesso",
};

export default function AdminGestaoAcessosPermissoesPage() {
  return (
    <Suspense fallback={<SuspenseFallback variant="section" />}>
      <PermissionsCatalogClient />
    </Suspense>
  );
}
