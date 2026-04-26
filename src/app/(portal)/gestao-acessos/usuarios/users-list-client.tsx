"use client";

import { RbacProvider } from "@/features/rbac/context";
import { RbacUsersList } from "@/features/rbac/screens/users-list";
import { useRbacTenant } from "@/lib/tenant/rbac/hooks";

export function UsersListClient() {
  const tenant = useRbacTenant();
  return (
    <RbacProvider
      basePath="/gestao-acessos"
      dominio="ACADEMIA"
      tenantId={tenant.tenantId ?? undefined}
    >
      <RbacUsersList dominio="ACADEMIA" tenantId={tenant.tenantId ?? undefined} />
    </RbacProvider>
  );
}
