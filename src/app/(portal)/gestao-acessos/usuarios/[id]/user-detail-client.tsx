"use client";

import { useSearchParams } from "next/navigation";

import { RbacProvider } from "@/features/rbac/context";
import { RbacUserDetail } from "@/features/rbac/screens/user-detail";
import { useRbacTenant } from "@/lib/tenant/rbac/hooks";

export function UserDetailClient({ id }: { id: string }) {
  const tenant = useRbacTenant();
  const params = useSearchParams();
  const userId = Number(id);

  if (!Number.isFinite(userId)) {
    return <p className="text-sm text-gym-danger">ID de usuário inválido.</p>;
  }

  return (
    <RbacProvider
      basePath="/gestao-acessos"
      dominio="ACADEMIA"
      tenantId={tenant.tenantId ?? undefined}
    >
      <RbacUserDetail
        dominio="ACADEMIA"
        tenantId={tenant.tenantId ?? undefined}
        userId={userId}
        initialNome={params.get("nome") ?? undefined}
        initialEmail={params.get("email") ?? undefined}
      />
    </RbacProvider>
  );
}
