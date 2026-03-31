"use client";

import type { CategoriaContaPagar, ContaPagar } from "@/lib/types";

import { useContasPagarData } from "./use-contas-pagar-data";
import { useContasPagarFilters } from "./use-contas-pagar-filters";
import { useContasPagarModals } from "./use-contas-pagar-modals";
import { useContasPagarActions } from "./use-contas-pagar-actions";

export const GRUPO_DRE_LABEL: Record<string, string> = {
  CUSTO_VARIAVEL: "Custo variável",
  DESPESA_OPERACIONAL: "Despesa operacional",
  DESPESA_FINANCEIRA: "Despesa financeira",
  IMPOSTOS: "Impostos",
};

export const CATEGORIA_LABEL: Record<CategoriaContaPagar, string> = {
  FOLHA: "Folha",
  ALUGUEL: "Aluguel",
  UTILIDADES: "Utilidades",
  IMPOSTOS: "Impostos",
  MARKETING: "Marketing",
  MANUTENCAO: "Manutenção",
  FORNECEDORES: "Fornecedores",
  OUTROS: "Outros",
};

export function contaTotal(conta: ContaPagar) {
  return Math.max(
    0,
    Number(conta.valorOriginal ?? 0) - Number(conta.desconto ?? 0) + Number(conta.jurosMulta ?? 0),
  );
}

export type ContasPagarWorkspace = ReturnType<typeof useContasPagarWorkspace>;

export function useContasPagarWorkspace() {
  const data = useContasPagarData();
  const filters = useContasPagarFilters({
    contas: data.contas,
    regrasRecorrencia: data.regrasRecorrencia,
    tipoContaMap: data.tipoContaMap,
  });
  const modals = useContasPagarModals(data.regrasRecorrencia);
  const actions = useContasPagarActions({
    tenantId: data.tenantId,
    contas: data.contas,
    setError: data.setError,
    load: data.load,
    setOpenNovaConta: modals.setOpenNovaConta,
    setOpenEditarConta: modals.setOpenEditarConta,
    setOpenPagarConta: modals.setOpenPagarConta,
    setSelectedConta: modals.setSelectedConta,
    setContaEditandoId: modals.setContaEditandoId,
  });

  return {
    // Data
    tenantId: data.tenantId,
    loading: data.loading,
    error: data.error,
    contas: data.contas,
    formasPagamento: data.formasPagamento,
    tiposConta: data.tiposConta,
    regrasRecorrencia: data.regrasRecorrencia,
    tipoContaMap: data.tipoContaMap,
    tiposAtivos: data.tiposAtivos,
    formasPagamentoUnicas: data.formasPagamentoUnicas,
    load: data.load,

    // Filters
    ...filters,

    // Modals
    ...modals,

    // Actions
    ...actions,
  };
}

export type { StatusFiltro, CategoriaFiltro, TipoFiltro, OrigemFiltro } from "./use-contas-pagar-filters";
