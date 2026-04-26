"use client";

import { RbacProvider } from "@/features/rbac/context";
import { RbacPermissionsCatalog } from "@/features/rbac/screens/permissions-catalog";
import { useRbacTenant } from "@/lib/tenant/rbac/hooks";

export function PermissionsCatalogClient() {
  const tenant = useRbacTenant();
  return (
    <RbacProvider
      basePath="/gestao-acessos"
      dominio="ACADEMIA"
      tenantId={tenant.tenantId ?? undefined}
    >
      <RbacPermissionsCatalog
        dominio="ACADEMIA"
        tenantId={tenant.tenantId ?? undefined}
      />
    </RbacProvider>
  );
}
