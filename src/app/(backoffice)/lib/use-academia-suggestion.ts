"use client";

import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SuggestionOption } from "@/components/shared/suggestion-input";
import { listGlobalAcademias } from "@/lib/backoffice/admin";
import { queryKeys } from "@/lib/query/keys";

const MAX_RESULTS = 50;
const STALE_TIME = 5 * 60 * 1000; // 5 minutos

export function useAcademiaSuggestion() {
  const query = useQuery({
    queryKey: queryKeys.admin.academias.list(),
    queryFn: () => listGlobalAcademias(),
    staleTime: STALE_TIME,
  });

  const options: SuggestionOption[] = useMemo(() => {
    const academias = query.data ?? [];
    return academias.slice(0, MAX_RESULTS).map((academia) => ({
      id: academia.id,
      label: academia.nome,
      searchText: [academia.documento, academia.endereco?.cidade]
        .filter(Boolean)
        .join(" "),
    }));
  }, [query.data]);

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
