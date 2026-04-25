import { apiRequest } from "./http";
import type {
  FeatureFlagsMap,
  FlagAdminItem,
} from "@/lib/shared/types/feature-flag";

// ---------------------------------------------------------------------------
// API functions — /api/v1/feature-flags (consumo)
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/feature-flags?tenantId=X
 *
 * Retorna o mapa `flagName -> enabled` consolidado para o tenant ativo
 * (DB + defaults). Consumido pelo hook `useFeatureFlags`.
 */
export async function getFeatureFlagsApi(input: {
  tenantId: string;
}): Promise<FeatureFlagsMap> {
  return apiRequest<FeatureFlagsMap>({
    path: "/api/v1/feature-flags",
    query: { tenantId: input.tenantId },
  });
}

// ---------------------------------------------------------------------------
// API functions — /api/v1/admin/feature-flags (gestão PLATAFORMA)
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/admin/feature-flags?tenantId=X
 *
 * Lista as flags com metadata (origem, autor, timestamp). Acesso restrito
 * a usuários PLATAFORMA — o BE retorna 403 caso contrário.
 */
export async function listAdminFeatureFlagsApi(input: {
  tenantId: string;
}): Promise<FlagAdminItem[]> {
  return apiRequest<FlagAdminItem[]>({
    path: "/api/v1/admin/feature-flags",
    query: { tenantId: input.tenantId },
  });
}

/**
 * PUT /api/v1/admin/feature-flags/{flagName}?tenantId=X
 *
 * Atualiza (upsert) o valor de uma flag para o tenant. Retorna o item
 * atualizado já com a nova metadata.
 */
export async function updateFeatureFlagApi(input: {
  tenantId: string;
  flagName: string;
  enabled: boolean;
}): Promise<FlagAdminItem> {
  return apiRequest<FlagAdminItem>({
    path: `/api/v1/admin/feature-flags/${encodeURIComponent(input.flagName)}`,
    method: "PUT",
    query: { tenantId: input.tenantId },
    body: { enabled: input.enabled },
  });
}
