"use client";

import { useQuery } from "@tanstack/react-query";

import { obterCapacidadesEfetivas } from "@/lib/api/gestao-acessos";

/**
 * Hook de autorização granular para o frontend (RBAC v2 — story #19).
 *
 * Consulta `GET /usuarios-perfil/{userId}/tenant/{tenantId}/capacidades`
 * (cache de 60s) e expõe um helper `hasCapacidade(key)`.
 *
 * Uso:
 *   const { hasCapacidade } = useHasCapacidade(meuUserId, tenantAtivo);
 *   if (hasCapacidade("comercial.vendas.cancel")) { ... }
 *
 * Não usa UserKind como fonte de autorização — regra invariante do PRD.
 */
export function useHasCapacidade(userId: number | string | undefined, tenantId: string | undefined) {
  const normalizedUserId =
    userId == null ? undefined : String(userId).trim() || undefined;
  const enabled = Boolean(normalizedUserId && tenantId);

  const query = useQuery({
    queryKey: ["rbac", "user-caps", normalizedUserId ?? null, tenantId ?? null],
    queryFn: () => obterCapacidadesEfetivas(normalizedUserId!, tenantId!),
    enabled,
    staleTime: 60_000,
  });

  const set = new Set<string>(query.data ?? []);

  return {
    capacidades: set,
    hasCapacidade: (key: string) => set.has(key),
    hasAny: (...keys: string[]) => keys.some((k) => set.has(k)),
    hasAll: (...keys: string[]) => keys.every((k) => set.has(k)),
    isLoading: query.isLoading,
    error: query.error as Error | null,
  };
}
