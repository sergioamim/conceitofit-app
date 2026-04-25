/**
 * Feature flags per-tenant — débito 3.29.
 *
 * Tipos do contrato com `/api/v1/feature-flags` (consumo) e
 * `/api/v1/admin/feature-flags` (gestão por PLATAFORMA).
 *
 * Visão geral:
 * - `FeatureFlagsMap` é o payload "leve" lido pelo cliente para alimentar
 *   `useFeatureFlags()` — apenas `flagName -> enabled`.
 * - `FlagAdminItem` é o payload completo usado na página admin, incluindo
 *   metadata (origem, autor, timestamp, default conhecido).
 */

/** Mapa simples flagName -> enabled, retornado por `GET /api/v1/feature-flags`. */
export interface FeatureFlagsMap {
  [flagName: string]: boolean;
}

/**
 * Item enriquecido (admin) — listagem por PLATAFORMA inclui metadados que
 * o cliente regular não precisa.
 *
 * - `source: "DB"` → flag persistida explicitamente para esse tenant.
 * - `source: "DEFAULT"` → flag não tem registro em DB; o BE retorna o valor
 *   default conhecido (`knownDefault: true`) ou `false` quando desconhecida.
 */
export interface FlagAdminItem {
  flagName: string;
  enabled: boolean;
  source: "DB" | "DEFAULT";
  updatedAt: string | null;
  updatedByUserId: number | null;
  knownDefault: boolean;
}
