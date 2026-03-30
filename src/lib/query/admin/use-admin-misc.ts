import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { searchGlobalPessoas } from "@/lib/api/admin-search";
import { getAdminBiExecutivoCompleto } from "@/lib/api/admin-bi";
import type { AdminBiExecutivoData } from "@/lib/api/admin-bi";
import {
  getIntegrationStatusApi,
  getGlobalConfigApi,
  updateGlobalConfigApi,
} from "@/lib/api/admin-config";
import { listBackofficeAcademiasApi } from "@/lib/api/backoffice";
import type {
  Academia,
  GlobalConfig,
  GlobalSearchResponse,
  IntegrationStatus,
} from "@/lib/types";
import { queryKeys } from "../keys";

// ── Busca Global ──────────────────────────────────────────────────────

export function useAdminBusca(query: string, size = 20) {
  return useQuery<GlobalSearchResponse>({
    queryKey: queryKeys.admin.busca.results(query, size),
    queryFn: () => searchGlobalPessoas({ query, size }),
    enabled: query.trim().length >= 2,
  });
}

// ── BI ────────────────────────────────────────────────────────────────

export function useAdminBiAcademias() {
  return useQuery<Academia[]>({
    queryKey: queryKeys.admin.bi.academias(),
    queryFn: () => listBackofficeAcademiasApi(),
  });
}

export function useAdminBiExecutivo(academiaId: string | null) {
  return useQuery<AdminBiExecutivoData>({
    queryKey: queryKeys.admin.bi.executivo(academiaId ?? ""),
    queryFn: () => getAdminBiExecutivoCompleto(academiaId!),
    enabled: Boolean(academiaId),
  });
}

// ── Configurações ─────────────────────────────────────────────────────

export function useAdminIntegrations() {
  return useQuery<IntegrationStatus[]>({
    queryKey: queryKeys.admin.configuracoes.integrations(),
    queryFn: () => getIntegrationStatusApi(),
  });
}

export function useAdminGlobalConfig() {
  return useQuery<GlobalConfig>({
    queryKey: queryKeys.admin.configuracoes.config(),
    queryFn: () => getGlobalConfigApi(),
  });
}

export function useUpdateAdminGlobalConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (config: GlobalConfig) => updateGlobalConfigApi(config),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.admin.configuracoes.all() });
    },
  });
}
