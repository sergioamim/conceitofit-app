import { useQuery } from "@tanstack/react-query";
import { getDreGerencialApi, getDreProjecaoApi } from "@/lib/api/financeiro-gerencial";
import type { DREGerencial, DREProjecao, DreProjectionScenario } from "@/lib/types";
import { queryKeys } from "./keys";

const DRE_STALE_TIME = 5 * 60_000; // 5 min — dados financeiros mudam pouco

export function useDreGerencial(input: {
  tenantId: string | undefined;
  tenantResolved: boolean;
  month?: number;
  year?: number;
  startDate?: string;
  endDate?: string;
  customRange: boolean;
}) {
  const periodoKey = input.customRange
    ? `${input.startDate}..${input.endDate}`
    : `${input.year}-${input.month}`;

  return useQuery<DREGerencial>({
    queryKey: queryKeys.dre.gerencial(input.tenantId ?? "", periodoKey),
    queryFn: () =>
      getDreGerencialApi({
        tenantId: input.tenantId!,
        ...(input.customRange
          ? { startDate: input.startDate, endDate: input.endDate }
          : { month: input.month, year: input.year }),
      }),
    enabled: Boolean(input.tenantId) && input.tenantResolved,
    staleTime: DRE_STALE_TIME,
    refetchOnWindowFocus: true,
  });
}

export function useDreProjecao(input: {
  tenantId: string | undefined;
  tenantResolved: boolean;
  startDate: string;
  endDate: string;
  cenario: DreProjectionScenario;
}) {
  return useQuery<DREProjecao>({
    queryKey: queryKeys.dre.projecao(
      input.tenantId ?? "",
      input.startDate,
      input.endDate,
      input.cenario,
    ),
    queryFn: () =>
      getDreProjecaoApi({
        tenantId: input.tenantId!,
        startDate: input.startDate,
        endDate: input.endDate,
        cenario: input.cenario,
      }),
    enabled: Boolean(input.tenantId) && input.tenantResolved,
    staleTime: DRE_STALE_TIME,
    refetchOnWindowFocus: true,
  });
}
