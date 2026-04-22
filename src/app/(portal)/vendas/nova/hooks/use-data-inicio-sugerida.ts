"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { listMatriculasByAlunoService } from "@/lib/tenant/comercial/runtime";
import { queryKeys } from "@/lib/query/keys";
import { addDaysToIsoDate, getBusinessTodayIso } from "@/lib/business-date";

interface UseDataInicioSugeridaInput {
  tenantId: string | null | undefined;
  alunoId: string | null | undefined;
}

interface UseDataInicioSugeridaResult {
  /** Data ISO (YYYY-MM-DD) sugerida para início do próximo contrato. */
  dataInicioSugerida: string;
  /**
   * True quando há contrato ATIVO do aluno no tenant — a sugestão vem do
   * `dataFim + 1` do último ativo (plano em sequência). False quando é a
   * primeira compra ou o cliente não possui contrato ativo.
   */
  emSequencia: boolean;
}

/**
 * VUN-Onda3 — hook de sugestão de data de início do plano.
 *
 * Dado `tenantId` + `alunoId`, busca o último contrato ATIVO do aluno
 * (via `listMatriculasByAlunoService`) e retorna `dataFim + 1 dia` como
 * sugestão. Quando não há contrato ativo (ou não há aluno selecionado),
 * retorna `hoje` (business date).
 *
 * A decisão é apenas uma *sugestão*: o operador pode editar livremente
 * a data no PaymentPanel (RN-Onda3).
 */
export function useDataInicioSugerida(
  input: UseDataInicioSugeridaInput,
): UseDataInicioSugeridaResult {
  const tenantId = input.tenantId ?? "";
  const alunoId = input.alunoId ?? "";
  const enabled = Boolean(tenantId) && Boolean(alunoId);

  const query = useQuery({
    queryKey: queryKeys.matriculas.byAluno(tenantId, alunoId),
    queryFn: () =>
      listMatriculasByAlunoService({
        tenantId,
        alunoId,
        page: 0,
        size: 50,
      }),
    enabled,
    staleTime: 30_000,
  });

  return useMemo(() => {
    const hojeIso = getBusinessTodayIso();
    if (!enabled) {
      return { dataInicioSugerida: hojeIso, emSequencia: false };
    }

    const matriculas = query.data ?? [];
    const ativas = matriculas.filter((m) => m.status === "ATIVA" && m.dataFim);
    if (ativas.length === 0) {
      return { dataInicioSugerida: hojeIso, emSequencia: false };
    }

    // Último contrato ativo = o que expira por último.
    const ultima = ativas.reduce((acc, curr) =>
      curr.dataFim > acc.dataFim ? curr : acc,
    );

    const proximoIso = addDaysToIsoDate(ultima.dataFim, 1);
    // Se o contrato já venceu (caso raro, status ATIVA + dataFim passada),
    // usar hoje como piso.
    const sugerida = proximoIso > hojeIso ? proximoIso : hojeIso;

    return { dataInicioSugerida: sugerida, emSequencia: proximoIso > hojeIso };
  }, [enabled, query.data]);
}
