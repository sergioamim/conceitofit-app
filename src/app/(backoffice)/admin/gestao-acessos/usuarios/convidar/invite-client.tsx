"use client";

import { RbacProvider } from "@/features/rbac/context";
import { RbacInvite } from "@/features/rbac/screens/invite";

export function InviteClient() {
  return (
    <RbacProvider basePath="/admin/gestao-acessos" dominio="PLATAFORMA">
      <RbacInvite dominio="PLATAFORMA" />
    </RbacProvider>
  );
}
