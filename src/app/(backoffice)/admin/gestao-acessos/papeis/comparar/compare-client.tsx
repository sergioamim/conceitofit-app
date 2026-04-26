"use client";

import { useSearchParams } from "next/navigation";

import { RbacProvider } from "@/features/rbac/context";
import { RbacRolesCompare } from "@/features/rbac/screens/roles-compare";

export function CompareClient() {
  const params = useSearchParams();
  const idsParam = params.get("ids") ?? "";
  const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean);

  return (
    <RbacProvider basePath="/admin/gestao-acessos" dominio="PLATAFORMA">
      <RbacRolesCompare dominio="PLATAFORMA" ids={ids} />
    </RbacProvider>
  );
}
