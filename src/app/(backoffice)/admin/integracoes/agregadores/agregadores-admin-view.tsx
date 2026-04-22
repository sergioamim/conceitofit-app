"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAdminAcademias, useAdminUnidades } from "@/backoffice/query";
import {
  TenantPicker,
  type TenantOption,
} from "@/components/admin/agregadores/tenant-picker";
import { AgregadoresDashboard } from "@/components/admin/agregadores/agregadores-dashboard";

/**
 * View client que decide entre seletor de tenants (AG-7.7) e dashboard do
 * tenant selecionado (AG-7.8), com base no query param `?tenantId`.
 *
 * Fonte dos tenants: `useAdminUnidades()` — reusa endpoint existente
 * `GET /api/v1/admin/unidades` que devolve todas as unidades acessíveis
 * ao admin global.
 */
export function AgregadoresAdminView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantId = searchParams?.get("tenantId") ?? null;

  const unidadesQuery = useAdminUnidades();
  const academiasQuery = useAdminAcademias();

  const academiaNomePorId = useMemo(() => {
    const map = new Map<string, string>();
    (academiasQuery.data ?? []).forEach((a) => map.set(a.id, a.nome));
    return map;
  }, [academiasQuery.data]);

  const tenants = useMemo<TenantOption[]>(() => {
    return (unidadesQuery.data ?? []).map((u) => ({
      id: u.id,
      nome: u.nome,
      academiaNome:
        u.academiaId ? academiaNomePorId.get(u.academiaId) : undefined,
      subdomain: u.subdomain,
    }));
  }, [unidadesQuery.data, academiaNomePorId]);

  if (tenantId) {
    return <AgregadoresDashboard tenantId={tenantId} />;
  }

  return (
    <TenantPicker
      tenants={tenants}
      loading={unidadesQuery.isLoading}
      onSelect={(id) =>
        router.push(
          `/admin/integracoes/agregadores?tenantId=${encodeURIComponent(id)}`,
        )
      }
    />
  );
}
