import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { StatusAluno } from "@/lib/types";
import { FILTER_ALL } from "@/lib/shared/constants/filters";

export function useTableSearchParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const status = (searchParams.get("status") ?? FILTER_ALL) as StatusAluno | typeof FILTER_ALL;
  const page = parseInt(searchParams.get("page") ?? "0", 10);
  const size = parseInt(searchParams.get("size") ?? "20", 10) as 20 | 50 | 100 | 200;

  const setParams = useCallback(
    (updates: Record<string, string | number | null | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
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

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const clearParams = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [pathname, router]);

  const hasActiveFilters = q !== "" || status !== FILTER_ALL;

  return {
    q,
    status,
    page,
    size,
    setParams,
    clearParams,
    hasActiveFilters,
  };
}
