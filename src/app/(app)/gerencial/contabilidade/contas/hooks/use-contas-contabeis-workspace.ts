"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import {
  listFinancialAccountsApi,
  createFinancialAccountApi,
  updateFinancialAccountApi,
} from "@/lib/api/financial";
import type { FinancialAccount, FinancialAccountType, FinancialAccountStatus } from "@/lib/types";

export type TipoFiltro = "TODOS" | FinancialAccountType;
export type StatusFiltro = "TODOS" | FinancialAccountStatus;

export const TIPO_LABEL: Record<FinancialAccountType, string> = {
  ATIVO: "Ativo",
  PASSIVO: "Passivo",
  RECEITA: "Receita",
  DESPESA: "Despesa",
  PATRIMONIO: "Patrimonio",
};

export function formatBRL(value: number) {
  return Number(value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export type ContasContabeisWorkspace = ReturnType<typeof useContasContabeisWorkspace>;

export interface NovaContaForm {
  codigo: string;
  nome: string;
  tipo: FinancialAccountType;
  descricao: string;
  contaPaiId: string;
}

export function useContasContabeisWorkspace() {
  const tenantContext = useTenantContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contas, setContas] = useState<FinancialAccount[]>([]);
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>("TODOS");
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>("TODOS");
  const [search, setSearch] = useState("");
  const [openNovaConta, setOpenNovaConta] = useState(false);

  const load = useCallback(async () => {
    if (!tenantContext.tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listFinancialAccountsApi({ tenantId: tenantContext.tenantId });
      setContas(data);
    } catch (err) {
      setError(normalizeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [tenantContext.tenantId]);

  useEffect(() => {
    if (tenantContext.tenantResolved && tenantContext.tenantId) {
      void load();
    }
  }, [load, tenantContext.tenantId, tenantContext.tenantResolved]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return contas.filter((conta) => {
      if (tipoFiltro !== "TODOS" && conta.tipo !== tipoFiltro) return false;
      if (statusFiltro !== "TODOS" && conta.status !== statusFiltro) return false;
      if (!term) return true;
      return (
        conta.codigo.toLowerCase().includes(term) ||
        conta.nome.toLowerCase().includes(term) ||
        (conta.descricao ?? "").toLowerCase().includes(term)
      );
    });
  }, [contas, tipoFiltro, statusFiltro, search]);

  const resumo = useMemo(() => {
    const byTipo = contas.reduce(
      (acc, c) => {
        acc[c.tipo] = (acc[c.tipo] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    const totalAtivo = contas
      .filter((c) => c.tipo === "ATIVO")
      .reduce((s, c) => s + c.saldoAtual, 0);
    const totalPassivo = contas
      .filter((c) => c.tipo === "PASSIVO")
      .reduce((s, c) => s + c.saldoAtual, 0);
    return { byTipo, totalAtivo, totalPassivo, total: contas.length };
  }, [contas]);

  async function handleCriarConta(form: NovaContaForm) {
    try {
      setError(null);
      await createFinancialAccountApi({
        tenantId: tenantContext.tenantId,
        codigo: form.codigo.trim(),
        nome: form.nome.trim(),
        tipo: form.tipo,
        descricao: form.descricao.trim() || undefined,
        contaPaiId: form.contaPaiId || undefined,
      });
      setOpenNovaConta(false);
      await load();
    } catch (err) {
      setError(normalizeErrorMessage(err));
    }
  }

  async function handleToggleStatus(conta: FinancialAccount) {
    try {
      setError(null);
      await updateFinancialAccountApi(conta.id, {
        status: conta.status === "ATIVA" ? "INATIVA" : "ATIVA",
      });
      await load();
    } catch (err) {
      setError(normalizeErrorMessage(err));
    }
  }

  return {
    loading,
    error,
    contas,
    tipoFiltro,
    setTipoFiltro,
    statusFiltro,
    setStatusFiltro,
    search,
    setSearch,
    openNovaConta,
    setOpenNovaConta,
    filtered,
    resumo,
    load,
    handleCriarConta,
    handleToggleStatus,
  };
}
