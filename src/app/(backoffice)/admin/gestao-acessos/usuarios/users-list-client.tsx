"use client";

import { RbacProvider } from "@/features/rbac/context";
import { RbacUsersList } from "@/features/rbac/screens/users-list";

export function UsersListClient() {
  return (
    <RbacProvider basePath="/admin/gestao-acessos" dominio="PLATAFORMA">
      <RbacUsersList dominio="PLATAFORMA" />
    </RbacProvider>
  );
}
