"use client";

import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SuggestionOption } from "@/components/shared/suggestion-input";
import { listGlobalUnidades } from "@/lib/backoffice/admin";
import { queryKeys } from "@/lib/query/keys";

const MAX_RESULTS = 50;
const STALE_TIME = 5 * 60 * 1000; // 5 minutos

export function useUnidadeSuggestion(academiaId?: string) {
  const query = useQuery({
    queryKey: queryKeys.admin.unidades.list(),
    queryFn: () => listGlobalUnidades(),
    staleTime: STALE_TIME,
  });

  const options: SuggestionOption[] = useMemo(() => {
    const unidades = query.data ?? [];
    const filtered = academiaId
      ? unidades.filter(
          (u) => u.academiaId === academiaId || u.groupId === academiaId,
        )
      : unidades;

    return filtered.slice(0, MAX_RESULTS).map((unidade) => ({
      id: unidade.id,
      label: unidade.nome,
      searchText: [unidade.documento, unidade.subdomain, unidade.endereco?.cidade]
        .filter(Boolean)
        .join(" "),
    }));
  }, [query.data, academiaId]);

  const onFocusOpen = useCallback(() => {
    if (!query.data && !query.isFetching) {
      void query.refetch();
    }
  }, [query]);

  return {
    options,
    onFocusOpen,
    isLoading: query.isLoading,
  };
}
