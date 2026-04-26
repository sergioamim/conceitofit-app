"use client";

import { RbacProvider } from "@/features/rbac/context";
import { RbacInvite } from "@/features/rbac/screens/invite";
import { useRbacTenant } from "@/lib/tenant/rbac/hooks";

export function InviteClient() {
  const tenant = useRbacTenant();
  return (
    <RbacProvider
      basePath="/gestao-acessos"
      dominio="ACADEMIA"
      tenantId={tenant.tenantId ?? undefined}
    >
      <RbacInvite dominio="ACADEMIA" tenantId={tenant.tenantId ?? undefined} />
    </RbacProvider>
  );
}
