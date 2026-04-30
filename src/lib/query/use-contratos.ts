import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getContratosDashboardMensalService,
  cancelarContratoService,
  editarContratoService,
  renovarContratoService,
} from "@/lib/tenant/comercial/runtime";
import {
  getContratosDashboardCarteiraSerieMensalApi,
  getContratosDashboardCarteiraSnapshotApi,
  listContratosEvolucaoCanaisApi,
  listContratosOrigemAlunosApi,
  listContratosSinaisRetencaoApi,
} from "@/lib/api/contratos";
import type {
  ContratoDashboardCarteiraSerieMensal,
  ContratoDashboardCarteiraSnapshot,
  ContratoDashboardMensalResult,
  ContratosDashboardMensalFilters,
  ContratoEvolucaoCanaisResult,
  ContratoOrigemAlunosResult,
  ContratoSinaisRetencaoResult,
} from "@/lib/api/contratos";
import { ApiRequestError } from "@/lib/api/http";
import { isTenantContextErrorMessage } from "@/lib/utils/error-codes";
import { queryKeys } from "./keys";

const PAGE_SIZE = 20;

function isTenantContextError(error: unknown): boolean {
  if (error instanceof ApiRequestError) {
    return isTenantContextErrorMessage(error.message);
  }
  if (error instanceof Error) {
    return isTenantContextErrorMessage(error.message);
  }
  return false;
}

export function useContratos(input: {
  tenantId: string | undefined;
  tenantResolved: boolean;
  monthKey: string;
  page: number;
  filters?: ContratosDashboardMensalFilters;
}) {
  return useQuery<ContratoDashboardMensalResult>({
    queryKey: queryKeys.contratos.dashboard(
      input.tenantId ?? "",
      input.monthKey,
      input.page,
      input.filters ?? {},
    ),
    queryFn: () =>
      getContratosDashboardMensalService({
        tenantId: input.tenantId!,
        mes: input.monthKey,
        page: input.page,
        size: PAGE_SIZE,
        filters: input.filters,
      }),
    enabled: Boolean(input.tenantId) && input.tenantResolved && input.monthKey.length > 0,
    retry: (failureCount, error) => {
      if (isTenantContextError(error) && failureCount < 1) return true;
      return false;
    },
  });
}

export function useContratosEvolucaoCanais(input: {
  tenantId: string | undefined;
  tenantResolved: boolean;
  monthKey: string;
  meses?: number;
}) {
  const meses = input.meses ?? 6;

  return useQuery<ContratoEvolucaoCanaisResult>({
    queryKey: queryKeys.contratos.evolucaoCanais(input.tenantId ?? "", input.monthKey, meses),
    queryFn: () =>
      listContratosEvolucaoCanaisApi({
        tenantId: input.tenantId,
        monthKey: input.monthKey,
        meses,
      }),
    enabled: Boolean(input.tenantId) && input.tenantResolved && input.monthKey.length > 0,
    retry: (failureCount, error) => {
      if (isTenantContextError(error) && failureCount < 1) return true;
      return false;
    },
  });
}

export function useContratosOrigemAlunos(input: {
  tenantId: string | undefined;
  tenantResolved: boolean;
  monthKey: string;
}) {
  return useQuery<ContratoOrigemAlunosResult>({
    queryKey: queryKeys.contratos.origemAlunos(input.tenantId ?? "", input.monthKey),
    queryFn: () =>
      listContratosOrigemAlunosApi({
        tenantId: input.tenantId,
        monthKey: input.monthKey,
      }),
    enabled: Boolean(input.tenantId) && input.tenantResolved && input.monthKey.length > 0,
    retry: (failureCount, error) => {
      if (isTenantContextError(error) && failureCount < 1) return true;
      return false;
    },
  });
}

export function useContratosSinaisRetencao(input: {
  tenantId: string | undefined;
  tenantResolved: boolean;
  monthKey: string;
}) {
  return useQuery<ContratoSinaisRetencaoResult>({
    queryKey: queryKeys.contratos.sinaisRetencao(input.tenantId ?? "", input.monthKey),
    queryFn: () =>
      listContratosSinaisRetencaoApi({
        tenantId: input.tenantId,
        monthKey: input.monthKey,
      }),
    enabled: Boolean(input.tenantId) && input.tenantResolved && input.monthKey.length > 0,
    retry: (failureCount, error) => {
      if (isTenantContextError(error) && failureCount < 1) return true;
      return false;
    },
  });
}

export function useContratosCarteiraSnapshot(input: {
  tenantId: string | undefined;
  tenantResolved: boolean;
  dataIso: string;
}) {
  return useQuery<ContratoDashboardCarteiraSnapshot>({
    queryKey: queryKeys.contratos.carteiraSnapshot(input.tenantId ?? "", input.dataIso),
    queryFn: () =>
      getContratosDashboardCarteiraSnapshotApi({
        tenantId: input.tenantId,
        data: input.dataIso,
      }),
    enabled: Boolean(input.tenantId) && input.tenantResolved && input.dataIso.length > 0,
    retry: (failureCount, error) => {
      if (isTenantContextError(error) && failureCount < 1) return true;
      return false;
    },
  });
}

export function useContratosCarteiraSerieMensal(input: {
  tenantId: string | undefined;
  tenantResolved: boolean;
  monthKey: string;
}) {
  return useQuery<ContratoDashboardCarteiraSerieMensal>({
    queryKey: queryKeys.contratos.carteiraSerieMensal(input.tenantId ?? "", input.monthKey),
    queryFn: () =>
      getContratosDashboardCarteiraSerieMensalApi({
        tenantId: input.tenantId,
        mes: input.monthKey,
      }),
    enabled: Boolean(input.tenantId) && input.tenantResolved && input.monthKey.length > 0,
    retry: (failureCount, error) => {
      if (isTenantContextError(error) && failureCount < 1) return true;
      return false;
    },
  });
}

export function useRenovarContrato() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { tenantId: string; id: string }) =>
      renovarContratoService(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["contratos"] });
    },
  });
}

export function useCancelarContrato() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { tenantId: string; id: string; assinaturaId?: string }) =>
      cancelarContratoService(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["contratos"] });
    },
  });
}

export function useEditarContrato() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { tenantId: string; id: string; dataInicio: string; motivo: string }) =>
      editarContratoService(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["contratos"] });
    },
  });
}
