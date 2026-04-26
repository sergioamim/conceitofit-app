"use client";

import { RbacProvider } from "@/features/rbac/context";
import { RbacNewRole } from "@/features/rbac/screens/new-role";
import { useRbacTenant } from "@/lib/tenant/rbac/hooks";

export function NewRoleClient() {
  const tenant = useRbacTenant();
  return (
    <RbacProvider
      basePath="/gestao-acessos"
      dominio="ACADEMIA"
      tenantId={tenant.tenantId ?? undefined}
    >
      <RbacNewRole dominio="ACADEMIA" tenantId={tenant.tenantId ?? undefined} />
    </RbacProvider>
  );
}
