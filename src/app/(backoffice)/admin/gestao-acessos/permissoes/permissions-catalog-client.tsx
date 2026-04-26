"use client";

import { RbacProvider } from "@/features/rbac/context";
import { RbacPermissionsCatalog } from "@/features/rbac/screens/permissions-catalog";

export function PermissionsCatalogClient() {
  return (
    <RbacProvider basePath="/admin/gestao-acessos" dominio="PLATAFORMA">
      <RbacPermissionsCatalog dominio="PLATAFORMA" />
    </RbacProvider>
  );
}
