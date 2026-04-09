import { useQuery } from "@tanstack/react-query";
import {
  getBiOperacionalSnapshotApi,
  getBiReceitaApi,
  getBiRetencaoApi,
  getBiInadimplenciaApi,
  type ReceitaPorPlano,
  type RetencaoCohort,
  type Inadimplencia,
} from "@/lib/api/bi";
import { listAcademiasApi, listUnidadesApi } from "@/lib/api/contexto-unidades";
import type { Academia, BiEscopo, BiOperationalSnapshot, BiSegmento, Tenant } from "@/lib/types";
import { queryKeys } from "./keys";

// ---------------------------------------------------------------------------
// Filters (academias + unidades) — cached, rarely changes
// ---------------------------------------------------------------------------

export interface BiFiltersData {
  academias: Academia[];
  tenants: Tenant[];
}

export function useBiFilters() {
  return useQuery<BiFiltersData>({
    queryKey: queryKeys.bi.filters(),
    queryFn: async () => {
      const [academias, tenants] = await Promise.all([
        listAcademiasApi(),
        listUnidadesApi(),
      ]);
      return { academias, tenants };
    },
    staleTime: 5 * 60_000, // 5 min — academias/unidades raramente mudam
    refetchOnWindowFocus: false,
  });
}

// ---------------------------------------------------------------------------
// Snapshot (heavy — aggregates multiple tenant datasets)
// ---------------------------------------------------------------------------

export interface UseBiSnapshotInput {
  scope: BiEscopo;
  tenantId: string | undefined;
  academiaId: string;
  startDate: string;
  endDate: string;
  segmento: BiSegmento;
  canViewNetwork: boolean;
  enabled: boolean;
}

export function useBiSnapshot(input: UseBiSnapshotInput) {
  return useQuery<BiOperationalSnapshot>({
    queryKey: queryKeys.bi.snapshot(
      input.scope,
      input.tenantId ?? "",
      input.academiaId,
      input.startDate,
      input.endDate,
      input.segmento,
    ),
    queryFn: () =>
      getBiOperacionalSnapshotApi({
        scope: input.scope,
        tenantId: input.tenantId,
        academiaId: input.academiaId,
        startDate: input.startDate,
        endDate: input.endDate,
        segmento: input.segmento,
        canViewNetwork: input.canViewNetwork,
      }),
    enabled: input.enabled && Boolean(input.tenantId),
    staleTime: 2 * 60_000,
    refetchOnWindowFocus: false,
  });
}

// ---------------------------------------------------------------------------
// Receita por Plano
// ---------------------------------------------------------------------------

export function useBiReceita(tenantId: string, inicio?: string, fim?: string) {
  return useQuery<ReceitaPorPlano>({
    queryKey: queryKeys.bi.receita(tenantId, inicio, fim),
    queryFn: () => getBiReceitaApi({ tenantId, inicio, fim }),
    enabled: Boolean(tenantId),
    staleTime: 2 * 60_000,
    refetchOnWindowFocus: false,
  });
}

// ---------------------------------------------------------------------------
// Retencao Cohort
// ---------------------------------------------------------------------------

export function useBiRetencao(tenantId: string, meses?: number) {
  return useQuery<RetencaoCohort>({
    queryKey: queryKeys.bi.retencao(tenantId, meses),
    queryFn: () => getBiRetencaoApi({ tenantId, meses }),
    enabled: Boolean(tenantId),
    staleTime: 2 * 60_000,
    refetchOnWindowFocus: false,
  });
}

// ---------------------------------------------------------------------------
// Inadimplencia
// ---------------------------------------------------------------------------

export function useBiInadimplencia(tenantId: string) {
  return useQuery<Inadimplencia>({
    queryKey: queryKeys.bi.inadimplencia(tenantId),
    queryFn: () => getBiInadimplenciaApi({ tenantId }),
    enabled: Boolean(tenantId),
    staleTime: 2 * 60_000,
    refetchOnWindowFocus: false,
  });
}
