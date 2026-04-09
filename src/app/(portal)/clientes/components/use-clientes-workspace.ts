"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { logger } from "@/lib/shared/logger";
import { useTableSearchParams } from "@/hooks/use-table-search-params";
import { getBusinessTodayIso } from "@/lib/business-date";
import { useUpdateCliente } from "@/lib/query/use-clientes";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { useDialogState } from "@/hooks/use-dialog-state";
import { Download } from "lucide-react";
import type { Aluno } from "@/lib/types";
import { FILTER_ALL } from "@/lib/shared/constants/filters";

import { useClientesData } from "./use-clientes-data";

const subscribeNoop = () => () => {};

export function useClientesWorkspace() {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const router = useRouter();
  const { tenantId, tenantResolved, setTenant } = useTenantContext();
  const {
    q, status: filtro, page, size: pageSize,
    setParams, clearParams, hasActiveFilters,
  } = useTableSearchParams();

  const [buscaInput, setBuscaInput] = useState(q);
  const busca = q;
  const wizard = useDialogState();
  const resumoDialog = useDialogState();
  const [clienteResumo, setClienteResumo] = useState<Aluno | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"cadastro" | "nome">("cadastro");
  const updateMutation = useUpdateCliente(tenantId);
  const currentMonthYear = useSyncExternalStore(
    subscribeNoop,
    () => getBusinessTodayIso().slice(0, 7),
    () => null,
  );

  const data = useClientesData({
    tenantId,
    tenantResolved,
    setTenant,
    filtro,
    page,
    pageSize,
  });

  // Reset selection on tenant change
  useEffect(() => { setSelectedIds([]); }, [tenantId]);

  // Sync search input with URL param
  useEffect(() => { setBuscaInput(q); }, [q]);

  // Debounce search input → URL
  useEffect(() => {
    const timer = setTimeout(() => {
      if (buscaInput !== q) setParams({ q: buscaInput || null });
    }, 500);
    return () => clearTimeout(timer);
  }, [buscaInput, q, setParams]);

  // Client-side search filter + sort
  const buscaDigits = busca.replace(/\D/g, "");
  const filtered = useMemo(() => {
    const result = data.alunos.filter((a) => {
      const matchStatus = filtro === FILTER_ALL || a.status === filtro;
      const matchBusca = !busca
        || a.nome.toLowerCase().includes(busca.toLowerCase())
        || a.email.toLowerCase().includes(busca.toLowerCase())
        || (buscaDigits && a.cpf.replace(/\D/g, "").includes(buscaDigits))
        || (buscaDigits && a.telefone.replace(/\D/g, "").includes(buscaDigits));
      return matchStatus && matchBusca;
    });
    if (sortBy === "nome") {
      return [...result].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));
    }
    return [...result].sort((a, b) => (b.dataCadastro ?? "").localeCompare(a.dataCadastro ?? ""));
  }, [data.alunos, filtro, busca, buscaDigits, sortBy]);
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

  // Resumo dialog derived state
  const clienteResumoPlano = useMemo(() => {
    if (!clienteResumo) return null;
    const ea = clienteResumo.estadoAtual;
    if (!ea?.descricaoContratoAtual && !ea?.dataFimContratoAtual) return null;
    return {
      nome: ea?.descricaoContratoAtual ?? "Plano ativo",
      dataFim: ea?.dataFimContratoAtual,
    };
  }, [clienteResumo]);

  const clienteResumoBaseHref = useMemo(() => {
    return clienteResumo ? `/clientes/${clienteResumo.id}` : "";
  }, [clienteResumo]);

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

  // Actions
  const handleLiberarSuspensao = useCallback(() => {
    if (!clienteResumo || updateMutation.isPending) return;
    confirm(`Confirmar liberação da suspensão de ${clienteResumo.nome}?`, async () => {
      try {
        await updateMutation.mutateAsync({
          tenantId: clienteResumo.tenantId,
          id: clienteResumo.id,
          data: { status: "ATIVO", suspensao: undefined },
        });
        setClienteResumo((prev) =>
          prev ? { ...prev, status: "ATIVO", suspensao: undefined } : prev,
        );
      } catch (error) {
        logger.error("Falha ao liberar suspensão", { module: "clientes", error });
        window.alert("Não foi possível liberar a suspensão no momento.");
      }
    });
  }, [clienteResumo, confirm, updateMutation]);

  const handleVerPerfil = useCallback(() => {
    if (!clienteResumoBaseHref) return;
    resumoDialog.close();
    router.push(clienteResumoBaseHref);
  }, [clienteResumoBaseHref, resumoDialog, router]);

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
    hasActiveFilters,

    // Selection
    selectedIds,
    setSelectedIds,
    bulkActions,

    // Dialogs
    wizard,
    resumoDialog,
    clienteResumo,
    setClienteResumo,
    clienteResumoPlano,
    clienteResumoBaseHref,
    liberandoSuspensao: updateMutation.isPending,
    ConfirmDialog,

    // Actions
    handleLiberarSuspensao,
    handleVerPerfil,
    router,
  };
}
