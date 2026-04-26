"use client";

import { RbacProvider } from "@/features/rbac/context";
import { RbacRoleEditor } from "@/features/rbac/screens/role-editor";

export function RoleEditorClient({ roleId }: { roleId: string }) {
  return (
    <RbacProvider basePath="/admin/gestao-acessos" dominio="PLATAFORMA">
      <RbacRoleEditor dominio="PLATAFORMA" roleId={roleId} />
    </RbacProvider>
  );
}
