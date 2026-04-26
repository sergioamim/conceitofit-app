"use client";

import { RbacProvider } from "@/features/rbac/context";
import { RbacRoleEditor } from "@/features/rbac/screens/role-editor";
import { useRbacTenant } from "@/lib/tenant/rbac/hooks";

export function RoleEditorClient({ roleId }: { roleId: string }) {
  const tenant = useRbacTenant();
  return (
    <RbacProvider
      basePath="/gestao-acessos"
      dominio="ACADEMIA"
      tenantId={tenant.tenantId ?? undefined}
    >
      <RbacRoleEditor
        dominio="ACADEMIA"
        tenantId={tenant.tenantId ?? undefined}
        roleId={roleId}
      />
    </RbacProvider>
  );
}
