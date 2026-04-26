"use client";

import { RbacProvider } from "@/features/rbac/context";
import { RbacSecurityPolicy } from "@/features/rbac/screens/security-policy";
import { useRbacTenant } from "@/lib/tenant/rbac/hooks";

export function SecurityPolicyClient() {
  const tenant = useRbacTenant();
  return (
    <RbacProvider
      basePath="/gestao-acessos"
      dominio="ACADEMIA"
      tenantId={tenant.tenantId ?? undefined}
    >
      <RbacSecurityPolicy
        dominio="ACADEMIA"
        tenantId={tenant.tenantId ?? undefined}
      />
    </RbacProvider>
  );
}
