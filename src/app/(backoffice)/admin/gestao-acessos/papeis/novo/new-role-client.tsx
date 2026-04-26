"use client";

import { RbacProvider } from "@/features/rbac/context";
import { RbacNewRole } from "@/features/rbac/screens/new-role";

export function NewRoleClient() {
  return (
    <RbacProvider basePath="/admin/gestao-acessos" dominio="PLATAFORMA">
      <RbacNewRole dominio="PLATAFORMA" />
    </RbacProvider>
  );
}
