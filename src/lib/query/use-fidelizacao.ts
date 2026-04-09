import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listCampanhasFidelizacaoApi,
  createCampanhaFidelizacaoApi,
  updateCampanhaFidelizacaoApi,
  listIndicacoesApi,
  createIndicacaoApi,
  converterIndicacaoApi,
  listSaldosFidelizacaoApi,
  getSaldoDetalheFidelizacaoApi,
  resgatarPontosFidelizacaoApi,
  type FidelizacaoCampanha,
  type Indicacao,
  type IndicacaoStatus,
  type SaldoResumo,
  type SaldoDetalhe,
} from "@/lib/api/fidelizacao";

export const fidelizacaoKeys = {
  campanhas: (tenantId: string) => ["fidelizacao", "campanhas", tenantId] as const,
  indicacoes: (tenantId: string, status?: IndicacaoStatus) =>
    ["fidelizacao", "indicacoes", tenantId, status ?? "all"] as const,
  saldos: (tenantId: string) => ["fidelizacao", "saldos", tenantId] as const,
  saldoDetalhe: (tenantId: string, alunoId: string) =>
    ["fidelizacao", "saldo", tenantId, alunoId] as const,
} as const;

// ---------------------------------------------------------------------------
// Campanhas
// ---------------------------------------------------------------------------

export function useCampanhasFidelizacao(input: {
  tenantId: string | undefined;
  apenasAtivas?: boolean;
}) {
  return useQuery<FidelizacaoCampanha[]>({
    queryKey: fidelizacaoKeys.campanhas(input.tenantId ?? ""),
    queryFn: () =>
      listCampanhasFidelizacaoApi({
        tenantId: input.tenantId!,
        apenasAtivas: input.apenasAtivas,
      }),
    enabled: Boolean(input.tenantId),
  });
}

export function useCreateCampanhaFidelizacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      tenantId: string;
      data: Parameters<typeof createCampanhaFidelizacaoApi>[0]["data"];
    }) => createCampanhaFidelizacaoApi(input),
    onSuccess: (_d, v) => {
      void qc.invalidateQueries({ queryKey: fidelizacaoKeys.campanhas(v.tenantId) });
    },
  });
}

export function useUpdateCampanhaFidelizacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      tenantId: string;
      id: string;
      data: Parameters<typeof updateCampanhaFidelizacaoApi>[0]["data"];
    }) => updateCampanhaFidelizacaoApi(input),
    onSuccess: (_d, v) => {
      void qc.invalidateQueries({ queryKey: fidelizacaoKeys.campanhas(v.tenantId) });
    },
  });
}

// ---------------------------------------------------------------------------
// Indicacoes
// ---------------------------------------------------------------------------

export function useIndicacoesFidelizacao(input: {
  tenantId: string | undefined;
  status?: IndicacaoStatus;
}) {
  return useQuery<Indicacao[]>({
    queryKey: fidelizacaoKeys.indicacoes(input.tenantId ?? "", input.status),
    queryFn: () =>
      listIndicacoesApi({ tenantId: input.tenantId!, status: input.status }),
    enabled: Boolean(input.tenantId),
  });
}

export function useCreateIndicacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      tenantId: string;
      data: Parameters<typeof createIndicacaoApi>[0]["data"];
    }) => createIndicacaoApi(input),
    onSuccess: (_d, v) => {
      void qc.invalidateQueries({ queryKey: fidelizacaoKeys.indicacoes(v.tenantId) });
      void qc.invalidateQueries({ queryKey: fidelizacaoKeys.saldos(v.tenantId) });
    },
  });
}

export function useConverterIndicacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      tenantId: string;
      id: string;
      data: Parameters<typeof converterIndicacaoApi>[0]["data"];
    }) => converterIndicacaoApi(input),
    onSuccess: (_d, v) => {
      void qc.invalidateQueries({ queryKey: fidelizacaoKeys.indicacoes(v.tenantId) });
      void qc.invalidateQueries({ queryKey: fidelizacaoKeys.saldos(v.tenantId) });
    },
  });
}

// ---------------------------------------------------------------------------
// Saldos / Extrato
// ---------------------------------------------------------------------------

export function useSaldosFidelizacao(input: { tenantId: string | undefined }) {
  return useQuery<SaldoResumo[]>({
    queryKey: fidelizacaoKeys.saldos(input.tenantId ?? ""),
    queryFn: () => listSaldosFidelizacaoApi({ tenantId: input.tenantId! }),
    enabled: Boolean(input.tenantId),
  });
}

export function useSaldoDetalheFidelizacao(input: {
  tenantId: string | undefined;
  alunoId: string | undefined;
}) {
  return useQuery<SaldoDetalhe>({
    queryKey: fidelizacaoKeys.saldoDetalhe(input.tenantId ?? "", input.alunoId ?? ""),
    queryFn: () =>
      getSaldoDetalheFidelizacaoApi({
        tenantId: input.tenantId!,
        alunoId: input.alunoId!,
      }),
    enabled: Boolean(input.tenantId) && Boolean(input.alunoId),
  });
}

export function useResgatarPontos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      tenantId: string;
      alunoId: string;
      data: { pontos: number; descricao?: string };
    }) => resgatarPontosFidelizacaoApi(input),
    onSuccess: (_d, v) => {
      void qc.invalidateQueries({ queryKey: fidelizacaoKeys.saldos(v.tenantId) });
      void qc.invalidateQueries({
        queryKey: fidelizacaoKeys.saldoDetalhe(v.tenantId, v.alunoId),
      });
    },
  });
}
