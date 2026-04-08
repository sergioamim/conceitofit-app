"use client";

import { useMemo, useState } from "react";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { useAdminCrud } from "@/lib/query/use-admin-crud";
import { FILTER_ALL, type WithFilterAll } from "@/lib/shared/constants/filters";
import {
  listFinancialAccountsApi,
  createFinancialAccountApi,
  updateFinancialAccountApi,
} from "@/lib/api/financial";
import type { FinancialAccount, FinancialAccountType, FinancialAccountStatus } from "@/lib/types";

export type TipoFiltro = WithFilterAll<FinancialAccountType>;
export type StatusFiltro = WithFilterAll<FinancialAccountStatus>;

export const TIPO_LABEL: Record<FinancialAccountType, string> = {
  ATIVO: "Ativo",
  PASSIVO: "Passivo",
  RECEITA: "Receita",
  DESPESA: "Despesa",
  PATRIMONIO: "Patrimonio",
};

type ContasContabeisWorkspace = ReturnType<typeof useContasContabeisWorkspace>;

export interface NovaContaForm {
  codigo: string;
  nome: string;
  tipo: FinancialAccountType;
  descricao: string;
  contaPaiId: string;
}

type CreatePayload = Parameters<typeof createFinancialAccountApi>[0];
type UpdatePayload = Partial<{ nome: string; descricao: string; status: string }>;

export function useContasContabeisWorkspace() {
  const tenantContext = useTenantContext();

  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>(FILTER_ALL);
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>(FILTER_ALL);
  const [search, setSearch] = useState("");
  const [openNovaConta, setOpenNovaConta] = useState(false);

  const {
    items: contas,
    isLoading: loading,
    error: loadError,
    refetch,
    create,
    update,
  } = useAdminCrud<FinancialAccount, CreatePayload, UpdatePayload>({
    domain: "contabilidade-contas",
    tenantId: tenantContext.tenantId,
    enabled: tenantContext.tenantResolved,
    listFn: (tid) => listFinancialAccountsApi({ tenantId: tid }),
    createFn: (tid, data) => createFinancialAccountApi({ ...data, tenantId: tid }),
    updateFn: (_tid, id, data) => updateFinancialAccountApi(id, data),
  });

  const error = loadError?.message ?? create?.error?.message ?? update?.error?.message ?? null;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return contas.filter((conta) => {
      if (tipoFiltro !== FILTER_ALL && conta.tipo !== tipoFiltro) return false;
      if (statusFiltro !== FILTER_ALL && conta.status !== statusFiltro) return false;
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
      await create!.mutateAsync({
        tenantId: tenantContext.tenantId,
        codigo: form.codigo.trim(),
        nome: form.nome.trim(),
        tipo: form.tipo,
        descricao: form.descricao.trim() || undefined,
        contaPaiId: form.contaPaiId || undefined,
      });
      setOpenNovaConta(false);
    } catch {
      // error is surfaced via create.error
    }
  }

  async function handleToggleStatus(conta: FinancialAccount) {
    try {
      await update!.mutateAsync({
        id: conta.id,
        data: { status: conta.status === "ATIVA" ? "INATIVA" : "ATIVA" },
      });
    } catch {
      // error is surfaced via update.error
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
    load: refetch,
    handleCriarConta,
    handleToggleStatus,
  };
}
