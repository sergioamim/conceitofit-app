import { useQuery } from "@tanstack/react-query";
import { listPublicTenants } from "@/lib/public/services";
import type { Tenant } from "@/lib/types";

const PUBLIC_TENANTS_STALE_TIME = 10 * 60_000; // 10 min — raramente muda

export function usePublicTenants() {
  return useQuery<Tenant[]>({
    queryKey: ["public", "tenants"],
    queryFn: listPublicTenants,
    staleTime: PUBLIC_TENANTS_STALE_TIME,
  });
}
