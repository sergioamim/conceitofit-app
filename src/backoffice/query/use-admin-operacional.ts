import { useQuery } from "@tanstack/react-query";
import {
  getAlertasOperacionais,
  getFeatureUsageByAcademia,
  getAcademiasHealthMap,
} from "@/backoffice/api/admin-metrics";
import type {
  AlertasOperacionaisResult,
  FeatureUsageByAcademiaResult,
  AcademiasHealthMap,
} from "@/lib/types";
import { queryKeys } from "@/lib/query/keys";

export function useAdminAlertasOperacionais() {
  return useQuery({
    queryKey: queryKeys.admin.operacional.alertas(),
    queryFn: () =>
      Promise.all([getAlertasOperacionais(), getFeatureUsageByAcademia()]).then(
        ([alertas, featureUsage]) => ({ alertas, featureUsage }),
      ),
  });
}

export function useAdminSaudeAcademias() {
  return useQuery<AcademiasHealthMap>({
    queryKey: queryKeys.admin.operacional.saude(),
    queryFn: () => getAcademiasHealthMap(),
  });
}
