"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listAlunosPageService,
} from "@/lib/tenant/comercial/runtime";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import type { Aluno, StatusAluno } from "@/lib/types";

interface UseClientesDataInput {
  tenantId: string | undefined;
  tenantResolved: boolean;
  setTenant: (tenantId: string) => Promise<void>;
  filtro: StatusAluno | "TODOS";
  page: number;
  pageSize: number;
}

export function useClientesData({
  tenantId,
  tenantResolved,
  setTenant,
  filtro,
  page,
  pageSize,
}: UseClientesDataInput) {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalClientes, setTotalClientes] = useState(0);
  const [metaPage, setMetaPage] = useState(0);
  const [metaSize, setMetaSize] = useState(20);
  const [statusTotals, setStatusTotals] = useState({
    TODOS: 0,
    ATIVO: 0,
    SUSPENSO: 0,
    INATIVO: 0,
    CANCELADO: 0,
  });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const applyLoadedData = useCallback((paged: Awaited<ReturnType<typeof listAlunosPageService>>) => {
    setAlunos(paged.items);
    setHasNextPage(paged.hasNext);
    setTotalClientes(paged.total ?? paged.items.length);
    setMetaPage(paged.page);
    setMetaSize(paged.size);

    const totais = paged.totaisStatus;
    const todos = totais?.total ?? paged.total ?? paged.items.length;
    const ativos = totais?.totalAtivo ?? 0;
    const suspensos = totais?.totalSuspenso ?? 0;
    const inativos = totais?.totalInativo ?? 0;
    const cancelados = totais?.totalCancelado ?? totais?.cancelados ?? 0;

    setStatusTotals({
      TODOS: todos,
      ATIVO: ativos,
      SUSPENSO: suspensos,
      INATIVO: inativos,
      CANCELADO: cancelados,
    });
  }, []);

  const loadSnapshot = useCallback(async (currentTenantId: string) => {
    return listAlunosPageService({
      tenantId: currentTenantId,
      status: filtro === "TODOS" ? undefined : filtro,
      page,
      size: pageSize,
    });
  }, [filtro, page, pageSize]);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setLoadError(null);

    try {
      const snapshot = await loadSnapshot(tenantId);
      applyLoadedData(snapshot);
    } catch (error) {
      const message = normalizeErrorMessage(error);
      const normalizedMessage = message.toLowerCase();
      const shouldRetryWithTenantSync =
        normalizedMessage.includes("x-context-id sem unidade ativa") ||
        normalizedMessage.includes("tenantid diverge da unidade ativa do contexto informado");

      if (!shouldRetryWithTenantSync) {
        setLoadError(message);
        return;
      }

      try {
        await setTenant(tenantId);
        const snapshot = await loadSnapshot(tenantId);
        applyLoadedData(snapshot);
      } catch (retryError) {
        setLoadError(normalizeErrorMessage(retryError));
      }
    } finally {
      setLoading(false);
    }
  }, [applyLoadedData, loadSnapshot, setTenant, tenantId]);

  useEffect(() => {
    // page reseta sozinho com a exclusão da chave na URL, porém não alteramos o custom hook diretamente
    setAlunos([]);
    setHasNextPage(false);
    setTotalClientes(0);
    setLoadError(null);
  }, [tenantId]);

  useEffect(() => {
    if (!tenantResolved || !tenantId) return;
    void load();
  }, [load, tenantId, tenantResolved]);

  return {
    alunos,
    hasNextPage,
    totalClientes,
    metaPage,
    metaSize,
    statusTotals,
    loadError,
    loading,
    load,
  };
}
