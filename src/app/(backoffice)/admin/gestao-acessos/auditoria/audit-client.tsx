"use client";

import { RbacProvider } from "@/features/rbac/context";
import { RbacAudit } from "@/features/rbac/screens/audit";

export function AuditClient() {
  return (
    <RbacProvider basePath="/admin/gestao-acessos" dominio="PLATAFORMA">
      <RbacAudit dominio="PLATAFORMA" />
    </RbacProvider>
  );
}
