"use client";

import { useQuery } from "@tanstack/react-query";
import { getFeatureFlagsApi } from "@/lib/api/feature-flags";
import type { FeatureFlagsMap } from "@/lib/shared/types/feature-flag";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";

// ---------------------------------------------------------------------------
// Query
// ---------------------------------------------------------------------------

/**
 * Carrega o mapa de feature flags do tenant ativo via
 * `GET /api/v1/feature-flags?tenantId=X`.
 *
 * Flags raramente mudam → `staleTime` alto (5 min) e sem refetch agressivo.
 *
 * Em caso de erro (BE indisponível), `data` é `undefined` — os helpers
 * (`useFeatureFlag`, `useCrmCadenciasEnabled`, ...) caem para o default
 * para preservar a UX.
 */
export function useFeatureFlags(activeTenantId: string | null | undefined) {
  return useQuery<FeatureFlagsMap>({
    queryKey: ["feature-flags", activeTenantId ?? null] as const,
    queryFn: () => getFeatureFlagsApi({ tenantId: activeTenantId ?? "" }),
    enabled: Boolean(activeTenantId),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Helper genérico — lê `flagName` do tenant ativo, com fallback determinístico.
 *
 * Casos cobertos:
 * - Tenant não resolvido / loading / erro → `defaultValue`.
 * - Mapa carregado e sem entrada explícita para `flagName` → `defaultValue`.
 * - Mapa carregado e com entrada explícita → respeita o valor do BE.
 */
export function useFeatureFlag(
  flagName: string,
  defaultValue = false,
): boolean {
  const { activeTenantId } = useTenantContext();
  const { data } = useFeatureFlags(activeTenantId);
  if (data == null) return defaultValue;
  const value = data[flagName];
  return typeof value === "boolean" ? value : defaultValue;
}

// ---------------------------------------------------------------------------
// Helpers específicos por flag
// ---------------------------------------------------------------------------

function readEnvKillSwitch(envKey: string): boolean {
  return (
    typeof process !== "undefined" && process.env[envKey] === "false"
  );
}

/**
 * Hook React para `crm.cadencias.enabled`.
 *
 * Regras:
 * - Env var `NEXT_PUBLIC_CRM_CADENCIAS_ENABLED=false` é **kill-switch global**:
 *   tem precedência sobre o DB. Quando setada, retorna `false` mesmo que o
 *   tenant tenha a flag habilitada.
 * - Caso contrário, lê do DB via `useFeatureFlag("crm.cadencias.enabled", true)`.
 *
 * Default `true` mantém compatibilidade com o comportamento anterior
 * (Story 3.24 — BE expõe `/api/v1/crm/cadencias/*` por padrão).
 */
export function useCrmCadenciasEnabled(): boolean {
  // Avalia o env (constante por build) ANTES dos hooks: se desligado
  // globalmente, ainda invocamos o hook para preservar a ordem dos hooks
  // entre renders e ignoramos o resultado.
  const killSwitch = readEnvKillSwitch("NEXT_PUBLIC_CRM_CADENCIAS_ENABLED");
  const dbValue = useFeatureFlag("crm.cadencias.enabled", true);
  return killSwitch ? false : dbValue;
}

/**
 * Hook React para `perfil.drawer-acoes.enabled` (Perfil v3 Wave 2).
 *
 * Mesma estratégia de kill-switch via env var. Default `true`.
 */
export function usePerfilDrawerAcoesEnabled(): boolean {
  const killSwitch = readEnvKillSwitch(
    "NEXT_PUBLIC_PERFIL_DRAWER_ACOES_ENABLED",
  );
  const dbValue = useFeatureFlag("perfil.drawer-acoes.enabled", true);
  return killSwitch ? false : dbValue;
}
