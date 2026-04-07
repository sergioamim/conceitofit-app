import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelarReservaAulaApi,
  listAulasAgendaApi,
  listReservasAulaApi,
  reservarAulaApi,
} from "@/lib/api/reservas";
import type { AulaSessao, ReservaAula, ReservaAulaOrigem } from "@/lib/types";
import { queryKeys } from "./keys";

export function useAulasSessoes(input: {
  tenantId: string | undefined;
  dateFrom: string;
  dateTo: string;
  enabled?: boolean;
}) {
  return useQuery<AulaSessao[]>({
    queryKey: queryKeys.aulas.sessoes(input.tenantId ?? "", input.dateFrom, input.dateTo),
    queryFn: () =>
      listAulasAgendaApi({
        tenantId: input.tenantId!,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
        apenasPortal: true,
      }),
    enabled: Boolean(input.tenantId) && input.dateFrom.length > 0 && (input.enabled !== false),
    // Task 485: sessões de aulas — 5min staleTime
    staleTime: 5 * 60 * 1000,
  });
}

export function useMinhasReservas(input: {
  tenantId: string | undefined;
  alunoId: string | undefined;
}) {
  return useQuery<ReservaAula[]>({
    queryKey: queryKeys.aulas.minhasReservas(input.tenantId ?? "", input.alunoId ?? ""),
    queryFn: () =>
      listReservasAulaApi({
        tenantId: input.tenantId!,
        alunoId: input.alunoId!,
      }),
    enabled: Boolean(input.tenantId) && Boolean(input.alunoId),
  });
}

export function useReservarAula() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      tenantId: string;
      data: {
        atividadeGradeId: string;
        data: string;
        alunoId: string;
        origem: ReservaAulaOrigem;
      };
    }) => reservarAulaApi(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["aulas"] });
    },
  });
}

export function useCancelarReserva() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { tenantId: string; id: string }) =>
      cancelarReservaAulaApi(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["aulas"] });
    },
  });
}
