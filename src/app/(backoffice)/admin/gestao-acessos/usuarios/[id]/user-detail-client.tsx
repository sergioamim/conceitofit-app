"use client";

import { useSearchParams } from "next/navigation";

import { RbacProvider } from "@/features/rbac/context";
import { RbacUserDetail } from "@/features/rbac/screens/user-detail";

export function UserDetailClient({ id }: { id: string }) {
  const params = useSearchParams();
  const userId = Number(id);

  if (!Number.isFinite(userId)) {
    return <p className="text-sm text-gym-danger">ID de usuário inválido.</p>;
  }

  return (
    <RbacProvider basePath="/admin/gestao-acessos" dominio="PLATAFORMA">
      <RbacUserDetail
        dominio="PLATAFORMA"
        userId={userId}
        initialNome={params.get("nome") ?? undefined}
        initialEmail={params.get("email") ?? undefined}
      />
    </RbacProvider>
  );
}
