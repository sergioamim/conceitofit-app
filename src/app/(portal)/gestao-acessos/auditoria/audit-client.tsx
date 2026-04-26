"use client";

import { RbacProvider } from "@/features/rbac/context";
import { RbacAudit } from "@/features/rbac/screens/audit";
import { useRbacTenant } from "@/lib/tenant/rbac/hooks";

export function AuditClient() {
  const tenant = useRbacTenant();
  return (
    <RbacProvider
      basePath="/gestao-acessos"
      dominio="ACADEMIA"
      tenantId={tenant.tenantId ?? undefined}
    >
      <RbacAudit dominio="ACADEMIA" tenantId={tenant.tenantId ?? undefined} />
    </RbacProvider>
  );
}
