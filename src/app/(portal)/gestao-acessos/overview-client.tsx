"use client";

import { RbacProvider } from "@/features/rbac/context";
import { RbacOverview } from "@/features/rbac/screens/overview";
import { useRbacTenant } from "@/lib/tenant/rbac/hooks";

export function RbacOverviewClient() {
  const tenant = useRbacTenant();
  return (
    <RbacProvider
      basePath="/gestao-acessos"
      dominio="ACADEMIA"
      tenantId={tenant.tenantId ?? undefined}
    >
      <RbacOverview dominio="ACADEMIA" tenantId={tenant.tenantId ?? undefined} />
    </RbacProvider>
  );
}
