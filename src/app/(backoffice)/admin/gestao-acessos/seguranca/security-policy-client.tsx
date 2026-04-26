"use client";

import { RbacProvider } from "@/features/rbac/context";
import { RbacSecurityPolicy } from "@/features/rbac/screens/security-policy";

export function SecurityPolicyClient() {
  return (
    <RbacProvider basePath="/admin/gestao-acessos" dominio="PLATAFORMA">
      <RbacSecurityPolicy dominio="PLATAFORMA" />
    </RbacProvider>
  );
}
