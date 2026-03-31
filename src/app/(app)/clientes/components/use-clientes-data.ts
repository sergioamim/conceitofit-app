"use client";

import { useMemo } from "react";
import { useClientes } from "@/lib/query/use-clientes";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import type { StatusAluno } from "@/lib/types";
import { FILTER_ALL, type WithFilterAll } from "@/lib/shared/constants/filters";

interface UseClientesDataInput {
  tenantId: string | undefined;
  tenantResolved: boolean;
  setTenant: (tenantId: string) => Promise<void>;
  filtro: WithFilterAll<StatusAluno>;
  page: number;
  pageSize: number;
}

export function useClientesData({
  tenantId,
  tenantResolved,
  filtro,
  page,
  pageSize,
}: UseClientesDataInput) {
  const statusFilter = filtro === FILTER_ALL ? undefined : filtro;

  const { data: queryData, isLoading: loading, error: queryError, refetch } = useClientes({
    tenantId,
    tenantResolved,
    status: statusFilter,
    page,
    size: pageSize,
  });

  const loadError = queryError ? normalizeErrorMessage(queryError) : null;

  const alunos = queryData?.items ?? [];
  const hasNextPage = queryData?.hasNext ?? false;
  const totalClientes = queryData?.total ?? alunos.length;
  const metaPage = queryData?.page ?? 0;
  const metaSize = queryData?.size ?? 20;

  const statusTotals = useMemo(() => {
    const totais = queryData?.totaisStatus;
    const todos = totais?.total ?? queryData?.total ?? alunos.length;
    return {
      TODOS: todos,
      ATIVO: totais?.totalAtivo ?? 0,
      SUSPENSO: totais?.totalSuspenso ?? 0,
      INATIVO: totais?.totalInativo ?? 0,
      CANCELADO: totais?.totalCancelado ?? (totais as Record<string, number> | undefined)?.cancelados ?? 0,
    };
  }, [queryData, alunos.length]);

  const load = async () => {
    await refetch();
  };

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
