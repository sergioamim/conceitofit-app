"use client";

import { useMemo, useCallback } from "react";
import type { SuggestionOption } from "@/components/shared/suggestion-input";
import { useAdminAcademias } from "@/backoffice/query";

/**
 * Hook que fornece options de academia formatadas para SuggestionInput
 * e callback de pre-carregamento para usar em CrudModal com type "suggestion".
 */
export function useAcademiaSuggestion() {
  const academiasQuery = useAdminAcademias();
  const academias = academiasQuery.data ?? [];

  const academiaOptions = useMemo<SuggestionOption[]>(
    () =>
      academias.map((academia) => ({
        id: academia.id,
        label: academia.nome,
        searchText: academia.documento ?? "",
      })),
    [academias],
  );

  /** Mapa id → nome para resolver display text em modo de edicao */
  const academiaIndex = useMemo(
    () => new Map(academias.map((a) => [a.id, a.nome])),
    [academias],
  );

  const onFocusOpen = useCallback(() => {
    // Garantir que os dados estejam carregados ao focar no campo
    if (!academiasQuery.data && !academiasQuery.isFetching) {
      void academiasQuery.refetch();
    }
  }, [academiasQuery]);

  return {
    academiaOptions,
    academiaIndex,
    academiasLoading: academiasQuery.isLoading,
    onFocusOpen,
  };
}
