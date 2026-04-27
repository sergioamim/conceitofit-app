"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTableSearchParams } from "@/hooks/use-table-search-params";
import { getBusinessTodayIso } from "@/lib/business-date";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { useDialogState } from "@/hooks/use-dialog-state";
import { Download } from "lucide-react";
import type { Aluno } from "@/lib/types";
import {
  countClienteListFilters,
  parseClienteListFilters,
} from "@/lib/tenant/comercial/clientes-filters";

import { useClientesData } from "./use-clientes-data";

const subscribeNoop = () => () => {};

export function useClientesWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tenantId, tenantResolved, setTenant } = useTenantContext();
  const {
    q, rawStatus, status: filtro, page, size: pageSize,
    setParams, clearParams, hasActiveFilters,
  } = useTableSearchParams();

  const [buscaInput, setBuscaInput] = useState(q);
  const busca = q;
  const wizard = useDialogState();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"cadastro" | "nome">("cadastro");
  const currentMonthYear = useSyncExternalStore(
    subscribeNoop,
    () => getBusinessTodayIso().slice(0, 7),
    () => null,
  );
  const advancedFilters = useMemo(
    () => parseClienteListFilters(searchParams),
    [searchParams],
  );
  const advancedFilterCount = useMemo(
    () => countClienteListFilters(advancedFilters),
    [advancedFilters],
  );
  const hasAnyFilters = hasActiveFilters || advancedFilterCount > 0;

  // P0-B (2026-04-23): `busca` agora é propagada server-side como `search`
  // pro endpoint `/api/v1/comercial/alunos`. A query backend foi estendida
  // pra cobrir nome/email/CPF/telefone (antes só nome+CPF). O filter()
  // abaixo virou só sort local — busca de verdade acontece no DB.
  const data = useClientesData({
    tenantId,
    tenantResolved,
    setTenant,
    filtro,
    search: q || undefined,
    filters: advancedFilters,
    page,
    pageSize,
  });

  // Reset selection on tenant change
  useEffect(() => { setSelectedIds([]); }, [tenantId]);

  // Sync search input with URL param
  useEffect(() => { setBuscaInput(q); }, [q]);

  // Remove status filters no longer supported on the page.
  useEffect(() => {
    if (!rawStatus || rawStatus === filtro) return;
    setParams({ status: null });
  }, [rawStatus, filtro, setParams]);

  // Debounce search input → URL
  useEffect(() => {
    const timer = setTimeout(() => {
      if (buscaInput !== q) setParams({ q: buscaInput || null });
    }, 500);
    return () => clearTimeout(timer);
  }, [buscaInput, q, setParams]);

  // Sort local (busca e status já filtrados pelo backend via P0-B).
  // Mantido client-side porque o backend hoje só ordena por `nome ASC`
  // no endpoint de lista; sort por `cadastro` continua sendo derivação
  // frontend sobre os itens da página atual.
  const filtered = useMemo(() => {
    if (sortBy === "nome") {
      return [...data.alunos].sort((a, b) =>
        a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }),
      );
    }
    return [...data.alunos].sort((a, b) =>
      (b.dataCadastro ?? "").localeCompare(a.dataCadastro ?? ""),
    );
  }, [data.alunos, sortBy]);
  const isSearchFiltered = busca.trim().length > 0;

  // Metrics
  const metrics = useMemo(() => {
    if (!currentMonthYear) {
      return { novos: 0, renovados: 0, naoRenovados: 0, evadidos: 0 };
    }

    const ym = currentMonthYear;
    const novos = data.alunos.filter((a) => a.dataCadastro.startsWith(ym)).length;
    const evadidos = data.alunos.filter(
      (a) =>
        (a.status === "CANCELADO" || a.status === "INATIVO") &&
        a.dataCadastro.startsWith(ym),
    ).length;
    return { novos, renovados: 0, naoRenovados: 0, evadidos };
  }, [currentMonthYear, data.alunos]);

  // Bulk CSV export
  const exportCsv = useCallback(() => {
    const toExport = selectedIds
      .map((id) => data.alunos.find((a) => a.id === id))
      .filter(Boolean) as Aluno[];
    if (toExport.length === 0) return;
    const rows = [
      ["Nome", "CPF", "Telefone", "Email", "Status"].join(","),
      ...toExport.map(
        (a) => `"${a.nome}","${a.cpf}","${a.telefone}","${a.email}","${a.status}"`,
      ),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "clientes-selecionados.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setSelectedIds([]);
  }, [data.alunos, selectedIds]);

  const bulkActions = useMemo(
    () => [{ label: "Exportar CSV", icon: Download, onClick: exportCsv }],
    [exportCsv],
  );

  return {
    // Data
    ...data,
    filtered,
    isSearchFiltered,
    metrics,
    tenantId,

    // Filter / search / sort
    filtro,
    buscaInput,
    setBuscaInput,
    sortBy,
    setSortBy,
    pageSize,
    page,
    setParams,
    clearParams,
    hasActiveFilters: hasAnyFilters,
    advancedFilters,
    advancedFilterCount,

    // Selection
    selectedIds,
    setSelectedIds,
    bulkActions,

    // Dialogs
    wizard,

    router,
  };
}
