"use client";

import { RbacProvider } from "@/features/rbac/context";
import { RbacRolesList } from "@/features/rbac/screens/roles-list";
import { useRbacTenant } from "@/lib/tenant/rbac/hooks";

export function RolesListClient() {
  const tenant = useRbacTenant();
  return (
    <RbacProvider
      basePath="/gestao-acessos"
      dominio="ACADEMIA"
      tenantId={tenant.tenantId ?? undefined}
    >
      <RbacRolesList dominio="ACADEMIA" tenantId={tenant.tenantId ?? undefined} />
    </RbacProvider>
  );
}
