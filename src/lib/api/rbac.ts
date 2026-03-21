import type {
  RbacActionFilter,
  RbacAuditoriaItem,
  RbacFeature,
  RbacFeatureConfig,
  RbacGrant,
  RbacGrantPayload,
  RbacPaginatedResult,
  RbacPerfil,
  RbacPerfilCreatePayload,
  RbacPerfilUpdatePayload,
  RbacResourceTypeFilter,
  RbacUser,
  RbacUserCreatePayload,
} from "@/lib/types";
import { apiRequest } from "./http";

type RbacAnyListResponse<T> =
  | T[]
  | {
      items?: T[];
      content?: T[];
      data?: T[];
      total?: number;
      page?: number;
      size?: number;
      hasNext?: boolean;
    };

interface RbacPerfilApiResponse {
  id: string | number;
  tenantId: string;
  name?: string;
  roleName?: string;
  displayName: string;
  description?: string | null;
  profileType?: string;
  active: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface RbacFeatureApiResponse {
  featureKey: string;
  enabled: boolean;
  rollout?: number;
  rolloutPercentage?: number;
}

interface RbacUserApiResponse {
  id?: string | number;
  tenantId?: string | null;
  username?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  fullName?: string | null;
  active?: boolean | null;
}

function cleanString(value?: string | null): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function splitNameParts(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ") || "Usuario";
  return {
    firstName,
    lastName,
  };
}

function resolveUsername(input: RbacUserCreatePayload) {
  const email = cleanString(input.email);
  if (email) return email.toLowerCase();
  const loginIdentifier = input.loginIdentifiers?.find((item) => cleanString(item.value))?.value;
  const normalizedIdentifier = cleanString(loginIdentifier);
  if (normalizedIdentifier) return normalizedIdentifier.toLowerCase();
  return input.name.trim().toLowerCase().replace(/\s+/g, ".");
}

function buildTemporaryPassword() {
  return "Temp@1234";
}

function normalizeRbacUser(input: RbacUserApiResponse): RbacUser {
  const firstName = cleanString(input.firstName);
  const lastName = cleanString(input.lastName);
  const fullName =
    cleanString(input.fullName)
    ?? cleanString(input.name)
    ?? [firstName, lastName].filter(Boolean).join(" ")
    ?? cleanString(input.username)
    ?? cleanString(input.email)
    ?? "";

  return {
    id: String(input.id ?? ""),
    tenantId: cleanString(input.tenantId) ?? "",
    name: fullName,
    fullName,
    email: cleanString(input.email) ?? "",
    active: input.active ?? undefined,
  };
}

function normalizeRbacPerfil(input: RbacPerfilApiResponse): RbacPerfil {
  return {
    id: String(input.id),
    tenantId: input.tenantId,
    roleName: input.roleName ?? input.name ?? "",
    displayName: input.displayName,
    description: input.description ?? undefined,
    active: Boolean(input.active),
    createdAt: input.createdAt ?? undefined,
    updatedAt: input.updatedAt ?? undefined,
  };
}

function normalizeRbacFeature(input: RbacFeatureApiResponse): RbacFeature {
  return {
    featureKey: input.featureKey,
    enabled: Boolean(input.enabled),
    rollout: input.rollout ?? input.rolloutPercentage ?? 0,
  };
}

function toArray<T>(response: RbacAnyListResponse<T>): T[] {
  if (Array.isArray(response)) return response;
  return (
    response.items ?? response.content ?? response.data ?? []
  ) as T[];
}

function toPagination<T>(response: RbacAnyListResponse<T>): RbacPaginatedResult<T> {
  if (Array.isArray(response)) {
    return {
      items: response,
      page: 0,
      size: response.length,
      hasNext: false,
      total: response.length,
    };
  }

  const items = toArray(response);
  return {
    items,
    page: Number(response.page ?? 0),
    size: Number(response.size ?? items.length),
    hasNext: Boolean(response.hasNext),
    total: Number(response.total ?? 0),
  };
}

export async function listPerfisApi(input: {
  tenantId: string;
  includeInactive?: boolean;
  page?: number;
  size?: number;
}): Promise<RbacPaginatedResult<RbacPerfil>> {
  const response = await apiRequest<RbacAnyListResponse<RbacPerfil>>({
    path: "/api/v1/auth/perfis",
    query: {
      tenantId: input.tenantId,
      includeInactive: input.includeInactive,
      envelope: true,
      page: input.page,
      size: input.size,
    },
  });
  if (Array.isArray(response)) {
    return toPagination(response.map(normalizeRbacPerfil));
  }
  return {
    ...toPagination(response),
    items: toPagination(response).items.map(normalizeRbacPerfil),
  };
}

export async function createPerfilApi(input: {
  tenantId: string;
  data: RbacPerfilCreatePayload;
}): Promise<RbacPerfil> {
  const response = await apiRequest<RbacPerfilApiResponse>({
    path: "/api/v1/auth/perfis",
    method: "POST",
    query: {
      tenantId: input.tenantId,
    },
    body: {
      name: input.data.roleName,
      displayName: input.data.displayName,
      description: input.data.description,
      profileType: "PADRAO",
    } satisfies Record<string, unknown>,
  });
  return normalizeRbacPerfil(response);
}

export async function updatePerfilApi(input: {
  tenantId: string;
  perfilId: string;
  data: RbacPerfilUpdatePayload;
}): Promise<RbacPerfil> {
  const payload: Partial<
    Pick<RbacPerfilApiResponse, "displayName" | "description" | "active">
  > = {};

  if (input.data.displayName !== undefined) {
    payload.displayName = input.data.displayName;
  }
  if (input.data.description !== undefined) {
    payload.description = input.data.description;
  }
  if (input.data.active !== undefined) {
    payload.active = input.data.active;
  }

  const response = await apiRequest<RbacPerfilApiResponse>({
    path: `/api/v1/auth/perfis/${input.perfilId}`,
    method: "PUT",
    query: {
      tenantId: input.tenantId,
    },
    body: payload,
  });
  return normalizeRbacPerfil(response);
}

export async function deletePerfilApi(input: {
  tenantId: string;
  perfilId: string;
}): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/auth/perfis/${input.perfilId}`,
    method: "DELETE",
    query: {
      tenantId: input.tenantId,
    },
  });
}

export async function listUsersApi(input: {
  tenantId?: string;
}): Promise<RbacUser[]> {
  const response = await apiRequest<RbacUserApiResponse[] | RbacAnyListResponse<RbacUserApiResponse>>({
    path: "/api/v1/auth/users",
    query: {
      tenantId: input.tenantId,
    },
  });
  return toArray(response).map(normalizeRbacUser);
}

export async function createUserApi(input: {
  tenantId: string;
  data: RbacUserCreatePayload;
}): Promise<RbacUser> {
  const fullName = input.data.fullName?.trim() || input.data.name.trim();
  const { firstName, lastName } = splitNameParts(fullName);
  const loginIdentifiers = input.data.loginIdentifiers?.filter((item) => cleanString(item.value)) ?? [];
  const response = await apiRequest<RbacUserApiResponse>({
    path: "/api/v1/auth/users",
    method: "POST",
    query: {
      tenantId: input.tenantId,
    },
    body: {
      username: resolveUsername(input.data),
      email: input.data.email,
      password: buildTemporaryPassword(),
      firstName,
      lastName,
      fullName,
      userKind: input.data.userKind,
      networkId: input.data.networkId,
      networkName: input.data.networkName,
      networkSubdomain: input.data.networkSubdomain,
      tenantIds: input.data.tenantIds,
      tenantId: input.data.defaultTenantId ?? input.tenantId,
      defaultTenantId: input.data.defaultTenantId ?? input.tenantId,
      initialPerfilIds: input.data.initialPerfilIds ?? [],
      loginIdentifiers,
      active: true,
    },
  });
  return normalizeRbacUser(response);
}

export async function listUserPerfisApi(input: {
  tenantId: string;
  userId: string;
}): Promise<RbacPerfil[]> {
  const response = await apiRequest<RbacPerfil[] | RbacAnyListResponse<RbacPerfil>>({
    path: `/api/v1/auth/users/${input.userId}/perfis`,
    query: {
      tenantId: input.tenantId,
    },
  });
  const items = toArray(response);
  return items.map((item) =>
    normalizeRbacPerfil(item as unknown as RbacPerfilApiResponse)
  );
}

export async function linkUserPerfilApi(input: {
  tenantId: string;
  userId: string;
  perfilId: string;
}): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/auth/users/${input.userId}/perfis/${input.perfilId}`,
    method: "PUT",
    query: {
      tenantId: input.tenantId,
    },
  });
}

export async function unlinkUserPerfilApi(input: {
  tenantId: string;
  userId: string;
  perfilId: string;
}): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/auth/users/${input.userId}/perfis/${input.perfilId}`,
    method: "DELETE",
    query: {
      tenantId: input.tenantId,
    },
  });
}

export async function listFeaturesApi(input: {
  tenantId: string;
}): Promise<RbacFeature[]> {
  const response = await apiRequest<RbacFeature[] | RbacAnyListResponse<RbacFeature>>({
    path: "/api/v1/auth/features",
    query: {
      tenantId: input.tenantId,
    },
  });
  return toArray(response).map((item) =>
    normalizeRbacFeature(item as unknown as RbacFeatureApiResponse)
  );
}

export async function updateFeatureApi(input: {
  tenantId: string;
  featureKey: string;
  data: RbacFeatureConfig;
}): Promise<RbacFeature> {
  const response = await apiRequest<RbacFeatureApiResponse>({
    path: `/api/v1/auth/features/${encodeURIComponent(input.featureKey)}`,
    method: "PUT",
    query: {
      tenantId: input.tenantId,
    },
    body: {
      enabled: input.data.enabled,
      rolloutPercentage: input.data.rollout,
    },
  });
  return normalizeRbacFeature(response);
}

export async function listGrantsApi(input: {
  tenantId: string;
}): Promise<RbacGrant[]> {
  const response = await apiRequest<RbacGrant[] | RbacAnyListResponse<RbacGrant>>({
    path: "/api/v1/auth/features/grants",
    query: {
      tenantId: input.tenantId,
    },
  });
  return toArray(response);
}

export async function saveGrantApi(input: {
  tenantId: string;
  data: RbacGrantPayload;
}): Promise<RbacGrant> {
  return apiRequest<RbacGrant>({
    path: "/api/v1/auth/features/grants",
    method: "POST",
    query: {
      tenantId: input.tenantId,
    },
    body: input.data,
  });
}

export async function listAuditoriaPermissoesApi(input: {
  tenantId: string;
  action?: RbacActionFilter;
  resourceType?: RbacResourceTypeFilter;
  limit?: number;
}): Promise<RbacAuditoriaItem[]> {
  const response = await apiRequest<RbacAuditoriaItem[] | RbacAnyListResponse<RbacAuditoriaItem>>({
    path: "/api/v1/auth/auditoria/permissoes",
    query: {
      tenantId: input.tenantId,
      action: input.action,
      resourceType: input.resourceType,
      limit: input.limit,
    },
  });
  return toArray(response);
}
