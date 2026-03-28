import type { RbacActionFilter, RbacFeature, RbacPaginatedResult, RbacPerfil as PerfilTipo, RbacPerfilCreatePayload, RbacPerfilUpdatePayload, RbacResourceTypeFilter, RbacUser, RbacUserCreatePayload } from "@/lib/types";
import { logger } from "@/lib/shared/logger";
import {
  createUserApi,
  createPerfilApi,
  deletePerfilApi,
  listAuditoriaPermissoesApi,
  listFeaturesApi,
  listGrantsApi,
  listPerfisApi,
  listUserPerfisApi,
  listUsersApi,
  linkUserPerfilApi,
  saveGrantApi,
  unlinkUserPerfilApi,
  updateFeatureApi,
  updatePerfilApi,
} from "@/lib/api/rbac";
import { ApiRequestError } from "@/lib/api/http";
import { getActiveTenantIdFromSession, getAvailableTenantsFromSession } from "@/lib/api/session";
import { meApi } from "@/lib/api/auth";

export type { RbacPerfil, RbacFeature } from "@/lib/types";

type RbacServiceError = unknown;

function normalizeTenantId(value: string | undefined | null): string | undefined {
  const candidate = value?.trim();
  return candidate || undefined;
}

function pushTenantCandidate(values: string[], candidate: string | undefined): void {
  const normalized = normalizeTenantId(candidate);
  if (!normalized || values.includes(normalized)) return;
  values.push(normalized);
}

async function resolveTenantCandidates(preferredTenantId?: string): Promise<string[]> {
  const candidates: string[] = [];
  const availableInSession = getAvailableTenantsFromSession();

  pushTenantCandidate(candidates, preferredTenantId);
  pushTenantCandidate(candidates, getActiveTenantIdFromSession());

  for (const item of availableInSession) {
    pushTenantCandidate(candidates, item.tenantId);
  }

  if (!availableInSession.length) {
    const me = await meApi();
    pushTenantCandidate(candidates, me.activeTenantId);
    for (const item of me.availableTenants ?? []) {
      pushTenantCandidate(candidates, item.tenantId);
    }
  }

  return candidates;
}

function isTenantAccessDeniedError(error: RbacServiceError): boolean {
  if (!(error instanceof ApiRequestError)) return false;
  const status = error.status;
  if (status !== 400 && status !== 403) return false;

  const normalizedMessage = `${error.message ?? ""} ${error.error ?? ""}`.toLocaleLowerCase();
  return (
    normalizedMessage.includes("tenant") &&
    (normalizedMessage.includes("sem acesso") ||
      normalizedMessage.includes("without access") ||
      normalizedMessage.includes("acesso ao tenant informado") ||
      normalizedMessage.includes("acesso ao tenant"))
  );
}

async function withTenantFallback<T>(
  preferredTenantId: string | undefined,
  action: (tenantId: string) => Promise<T>
): Promise<T> {
  const candidates = await resolveTenantCandidates(preferredTenantId);
  let lastAccessDeniedError: RbacServiceError | undefined;

  if (candidates.length === 0) {
    throw new Error("Não foi possível identificar um tenant válido para RBAC.");
  }

  for (const tenantId of candidates) {
    try {
      return await action(tenantId);
    } catch (error) {
      if (!isTenantAccessDeniedError(error)) {
        throw error;
      }

      logger.warn(`Tenant ${tenantId} sem acesso para RBAC. Tentando próximo tenant.`, { module: "rbac", error });
      lastAccessDeniedError = error;
    }
  }

  if (lastAccessDeniedError) {
    throw lastAccessDeniedError;
  }

  throw new Error("RBAC indisponível para todos os tenants disponíveis.");
}

export async function listPerfisService(params: {
  tenantId?: string;
  includeInactive?: boolean;
  page?: number;
  size?: number;
}): Promise<RbacPaginatedResult<PerfilTipo>> {
  return withTenantFallback(params.tenantId, (tenantId) =>
    listPerfisApi({
      tenantId,
      includeInactive: params.includeInactive,
      page: params.page,
      size: params.size,
    })
  );
}

export async function createPerfilService(input: {
  tenantId?: string;
  data: RbacPerfilCreatePayload;
}): Promise<PerfilTipo> {
  return withTenantFallback(input.tenantId, (tenantId) =>
    createPerfilApi({ tenantId, data: input.data })
  );
}

export async function updatePerfilService(input: {
  tenantId?: string;
  perfilId: string;
  data: RbacPerfilUpdatePayload;
}): Promise<PerfilTipo> {
  return withTenantFallback(input.tenantId, (tenantId) =>
    updatePerfilApi({ tenantId, perfilId: input.perfilId, data: input.data })
  );
}

export async function removePerfilService(input: {
  tenantId?: string;
  perfilId: string;
}): Promise<void> {
  return withTenantFallback(input.tenantId, (tenantId) =>
    deletePerfilApi({ tenantId, perfilId: input.perfilId })
  );
}

export async function listUsersService(params: { tenantId?: string }): Promise<RbacUser[]> {
  return withTenantFallback(params.tenantId, (tenantId) => listUsersApi({ tenantId }));
}

export async function createUserService(input: {
  tenantId?: string;
  data: RbacUserCreatePayload;
}): Promise<RbacUser> {
  const tenantId = normalizeTenantId(input.tenantId);
  if (!tenantId) {
    throw new Error("Não foi possível identificar a unidade ativa para criar o usuário.");
  }
  return createUserApi({
    tenantId,
    data: input.data,
  });
}

export async function listUserPerfisService(input: {
  tenantId?: string;
  userId: string;
}): Promise<PerfilTipo[]> {
  return withTenantFallback(input.tenantId, (tenantId) =>
    listUserPerfisApi({
      tenantId,
      userId: input.userId,
    })
  );
}

export async function linkPerfilUsuarioService(input: {
  tenantId?: string;
  userId: string;
  perfilId: string;
}): Promise<void> {
  return withTenantFallback(input.tenantId, (tenantId) =>
    linkUserPerfilApi({
      tenantId,
      userId: input.userId,
      perfilId: input.perfilId,
    })
  );
}

export async function unlinkPerfilUsuarioService(input: {
  tenantId?: string;
  userId: string;
  perfilId: string;
}): Promise<void> {
  return withTenantFallback(input.tenantId, (tenantId) =>
    unlinkUserPerfilApi({
      tenantId,
      userId: input.userId,
      perfilId: input.perfilId,
    })
  );
}

export async function listFeaturesService(input: { tenantId?: string }): Promise<RbacFeature[]> {
  return withTenantFallback(input.tenantId, (tenantId) => listFeaturesApi({ tenantId }));
}

export async function updateFeatureService(input: {
  tenantId?: string;
  featureKey: string;
  enabled: boolean;
  rollout: number;
}): Promise<RbacFeature> {
  return withTenantFallback(input.tenantId, (tenantId) =>
    updateFeatureApi({
      tenantId,
      featureKey: input.featureKey,
      data: {
        enabled: input.enabled,
        rollout: input.rollout,
      },
    })
  );
}

export async function listGrantsService(input: { tenantId?: string }): Promise<import("@/lib/types").RbacGrant[]> {
  return withTenantFallback(input.tenantId, (tenantId) => listGrantsApi({ tenantId }));
}

export async function saveGrantService(input: {
  tenantId?: string;
  perfilRoleName: string;
  featureKey: string;
  permission: "VIEW" | "EDIT" | "MANAGE";
  allowed: boolean;
}): Promise<import("@/lib/types").RbacGrant> {
  return withTenantFallback(input.tenantId, (tenantId) =>
    saveGrantApi({
      tenantId,
      data: {
        roleName: input.perfilRoleName,
        featureKey: input.featureKey,
        permission: input.permission,
        allowed: input.allowed,
      },
    })
  );
}

export async function listAuditoriaService(input: {
  tenantId?: string;
  action?: RbacActionFilter;
  resourceType?: RbacResourceTypeFilter;
  limit?: number;
}): Promise<import("@/lib/types").RbacAuditoriaItem[]> {
  return withTenantFallback(input.tenantId, (tenantId) =>
    listAuditoriaPermissoesApi({
      tenantId,
      action: input.action,
      resourceType: input.resourceType,
      limit: input.limit,
    })
  );
}
