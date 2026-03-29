import { useQuery } from "@tanstack/react-query";
import { getDashboardApi, type DashboardScope } from "@/lib/api/dashboard";
import type { DashboardData } from "@/lib/types";
import { queryKeys } from "./keys";

export function useDashboard(input: {
  tenantId: string | undefined;
  referenceDate: string;
  scope?: DashboardScope;
  initialData?: DashboardData;
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
  });
}
