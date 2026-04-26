"use client";

import { RbacProvider } from "@/features/rbac/context";
import { RbacRolesList } from "@/features/rbac/screens/roles-list";

export function RolesListClient() {
  return (
    <RbacProvider basePath="/admin/gestao-acessos" dominio="PLATAFORMA">
      <RbacRolesList dominio="PLATAFORMA" />
    </RbacProvider>
  );
}
