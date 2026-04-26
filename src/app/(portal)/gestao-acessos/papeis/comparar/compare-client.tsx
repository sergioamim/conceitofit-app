"use client";

import { useSearchParams } from "next/navigation";

import { RbacProvider } from "@/features/rbac/context";
import { RbacRolesCompare } from "@/features/rbac/screens/roles-compare";
import { useRbacTenant } from "@/lib/tenant/rbac/hooks";

export function CompareClient() {
  const tenant = useRbacTenant();
  const params = useSearchParams();
  const idsParam = params.get("ids") ?? "";
  const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean);

  return (
    <RbacProvider
      basePath="/gestao-acessos"
      dominio="ACADEMIA"
      tenantId={tenant.tenantId ?? undefined}
    >
      <RbacRolesCompare
        dominio="ACADEMIA"
        tenantId={tenant.tenantId ?? undefined}
        ids={ids}
      />
    </RbacProvider>
  );
}
