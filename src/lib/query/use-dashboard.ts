import { useQuery } from "@tanstack/react-query";
import { getDashboardApi, type DashboardScope } from "@/lib/api/dashboard";
import type { DashboardData } from "@/lib/types";
import { queryKeys } from "./keys";

const DASHBOARD_STALE_TIME = 30_000; // 30s — dados válidos por 30s antes de refetch
const DASHBOARD_REFETCH_INTERVAL = 60_000; // 60s — auto-refresh para KPIs atualizados

export function useDashboard(input: {
  tenantId: string | undefined;
  referenceDate: string;
  scope?: DashboardScope;
  initialData?: DashboardData;
  /** Desabilitar auto-refresh (útil para testes ou páginas em segundo plano) */
  disableAutoRefresh?: boolean;
}) {
  return useQuery<DashboardData>({
    queryKey: queryKeys.dashboard(input.tenantId ?? "", input.referenceDate),
    queryFn: () =>
      getDashboardApi({
        tenantId: input.tenantId!,
        referenceDate: input.referenceDate,
        scope: input.scope ?? "FULL",
      }),
    enabled: Boolean(input.tenantId) && input.referenceDate.length > 0,
    initialData: input.initialData,
    staleTime: DASHBOARD_STALE_TIME,
    refetchInterval: input.disableAutoRefresh ? false : DASHBOARD_REFETCH_INTERVAL,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
  });
}
