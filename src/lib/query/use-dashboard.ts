import { useQuery } from "@tanstack/react-query";
import { getDashboardApi, type DashboardScope } from "@/lib/api/dashboard";
import type { DashboardData } from "@/lib/types";
import { queryKeys } from "./keys";

const DASHBOARD_STALE_TIME = 30_000; // 30s — dados válidos por 30s antes de refetch
const DASHBOARD_REFETCH_INTERVAL = 60_000; // 60s — auto-refresh para KPIs atualizados

type UseDashboardScopeInput = {
  tenantId: string | undefined;
  referenceDate: string;
  scope: DashboardScope;
  /** Só faz fetch quando habilitado (ex.: primeira visita à aba). */
  enabled?: boolean;
  initialData?: DashboardData;
  /** Desabilitar auto-refresh (útil para testes ou páginas em segundo plano) */
  disableAutoRefresh?: boolean;
};

/**
 * Métricas do cockpit por escopo/alinhadas às abas (CLIENTES · VENDAS · FINANCEIRO).
 * Cada `scope` tem cache próprio (`queryKeys.dashboard`).
 */
export function useDashboardTab(input: UseDashboardScopeInput) {
  const resolvedScope = input.scope;
  const enabled =
    Boolean(input.enabled ?? true) && Boolean(input.tenantId) && input.referenceDate.length > 0;

  return useQuery<DashboardData>({
    queryKey: queryKeys.dashboard(input.tenantId ?? "", input.referenceDate, resolvedScope),
    queryFn: () =>
      getDashboardApi({
        tenantId: input.tenantId!,
        referenceDate: input.referenceDate,
        scope: resolvedScope,
      }),
    enabled,
    initialData: input.initialData,
    staleTime: DASHBOARD_STALE_TIME,
    refetchInterval: input.disableAutoRefresh ? false : DASHBOARD_REFETCH_INTERVAL,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
  });
}

/**
 * Payload completo legacy (`FULL`). Preferir {@link useDashboardTab} nas abas.
 */
export function useDashboard(input: {
  tenantId: string | undefined;
  referenceDate: string;
  scope?: DashboardScope;
  initialData?: DashboardData;
  disableAutoRefresh?: boolean;
}) {
  return useDashboardTab({
    tenantId: input.tenantId,
    referenceDate: input.referenceDate,
    scope: input.scope ?? "FULL",
    enabled: Boolean(input.tenantId) && input.referenceDate.length > 0,
    initialData: input.initialData,
    disableAutoRefresh: input.disableAutoRefresh,
  });
}
