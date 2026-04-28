import { useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { StatusAluno } from "@/lib/types";
import { FILTER_ALL } from "@/lib/shared/constants/filters";

const ALLOWED_STATUS_FILTERS = new Set<StatusAluno | typeof FILTER_ALL>([
  FILTER_ALL,
  "ATIVO",
  "SUSPENSO",
  "INATIVO",
]);

const ALLOWED_SORT_VALUES = new Set(["cadastro", "nome"]);

export function useTableSearchParams() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQueryString = searchParams.toString();

  const q = searchParams.get("q") ?? "";
  const rawStatus = searchParams.get("status") as StatusAluno | null;
  const status = ALLOWED_STATUS_FILTERS.has(rawStatus ?? FILTER_ALL)
    ? (rawStatus ?? FILTER_ALL)
    : FILTER_ALL;
  const rawSort = searchParams.get("sort");
  const sort = ALLOWED_SORT_VALUES.has(rawSort ?? "")
    ? (rawSort as "cadastro" | "nome")
    : "cadastro";
  const page = parseInt(searchParams.get("page") ?? "0", 10);
  const size = parseInt(searchParams.get("size") ?? "20", 10) as 20 | 50 | 100 | 200;

  const setParams = useCallback(
    (updates: Record<string, string | number | null | undefined>) => {
      const params = new URLSearchParams(currentQueryString);
      let resetPage = false;
      
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
        
        // Se qualqer filtro mudar exceto a própria página, a página deve resetar para 0
        if (key !== "page") {
          resetPage = true;
        }
      });

      if (resetPage) {
        params.delete("page");
      }

      const nextQueryString = params.toString();
      const nextUrl = nextQueryString ? `${pathname}?${nextQueryString}` : pathname;
      window.history.pushState(null, "", nextUrl);
    },
    [currentQueryString, pathname]
  );

  const clearParams = useCallback(() => {
    window.history.pushState(null, "", pathname);
  }, [pathname]);

  const hasActiveFilters = q !== "" || status !== FILTER_ALL;

  return {
    q,
    rawStatus,
    status,
    sort,
    page,
    size,
    setParams,
    clearParams,
    hasActiveFilters,
  };
}
