import type {
  GlobalAdminMembership,
  GlobalAdminMembershipOrigin,
  GlobalAdminMembershipProfile,
  GlobalAdminNewUnitsPolicy,
  GlobalAdminNewUnitsPolicyScope,
  GlobalAdminSecurityOverview,
  GlobalAdminUserDetail,
  GlobalAdminUserStatus,
  GlobalAdminUserSummary,
  RbacPaginatedResult,
  RbacPerfil,
} from "@/lib/types";
import { apiRequest } from "./http";

type AnyListResponse<T> =
  | T[]
  | {
      items?: T[];
      content?: T[];
      data?: T[];
      rows?: T[];
      result?: T[];
      total?: number;
      page?: number;
      size?: number;
      hasNext?: boolean;
    };

type RawRef = {
  id?: string | null;
  nome?: string | null;
  name?: string | null;
};

type RawPerfil = {
  id?: string | number | null;
  tenantId?: string | null;
  roleName?: string | null;
  name?: string | null;
  displayName?: string | null;
  description?: string | null;
  active?: unknown;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type RawMembershipProfile = {
  perfilId?: string | number | null;
  id?: string | number | null;
  roleName?: string | null;
  name?: string | null;
  displayName?: string | null;
  active?: unknown;
  inherited?: unknown;
};

type RawMembership = {
  id?: string | null;
  membershipId?: string | null;
  userId?: string | null;
  tenantId?: string | null;
  unidadeId?: string | null;
  tenantName?: string | null;
  unidadeNome?: string | null;
  academiaId?: string | null;
  groupId?: string | null;
  academiaName?: string | null;
  academiaNome?: string | null;
  active?: unknown;
  ativo?: unknown;
  defaultTenant?: unknown;
  unidadePadrao?: unknown;
  accessOrigin?: string | null;
  origemAcesso?: string | null;
  inheritedFrom?: string | null;
  origemDetalhe?: string | null;
  eligibleForNewUnits?: unknown;
  elegivelNovasUnidades?: unknown;
  profiles?: RawMembershipProfile[] | null;
  perfis?: RawMembershipProfile[] | null;
  availableProfiles?: RawPerfil[] | null;
  catalogoPerfis?: RawPerfil[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type RawPolicy = {
  enabled?: unknown;
  autoAssignToNewUnits?: unknown;
  elegivel?: unknown;
  scope?: string | null;
  escopo?: string | null;
  academiaIds?: string[] | null;
  inherited?: unknown;
  rationale?: string | null;
  motivo?: string | null;
  updatedAt?: string | null;
};

type RawUserSummary = {
  id?: string | null;
  userId?: string | null;
  name?: string | null;
  nome?: string | null;
  fullName?: string | null;
  email?: string | null;
  status?: string | null;
  active?: unknown;
  academias?: RawRef[] | null;
  units?: RawRef[] | null;
  perfis?: Array<string | RawMembershipProfile> | null;
  profiles?: Array<string | RawMembershipProfile> | null;
  membershipsAtivos?: number | null;
  activeMemberships?: number | null;
  membershipsTotal?: number | null;
  totalMemberships?: number | null;
  defaultTenantId?: string | null;
  defaultUnitId?: string | null;
  defaultTenantName?: string | null;
  defaultUnitName?: string | null;
  eligibleForNewUnits?: unknown;
  elegivelNovasUnidades?: unknown;
};

type RawUserDetail = RawUserSummary & {
  createdAt?: string | null;
  lastLoginAt?: string | null;
  memberships?: RawMembership[] | null;
  policy?: RawPolicy | null;
};

function cleanString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function normalizeBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "sim", "ativo", "enabled"].includes(normalized)) return true;
    if (["false", "0", "nao", "não", "inativo", "disabled"].includes(normalized)) return false;
  }
  return fallback;
}

function normalizeArray<T>(response: AnyListResponse<T>): T[] {
  if (Array.isArray(response)) return response;
  return response.items ?? response.content ?? response.data ?? response.rows ?? response.result ?? [];
}

function normalizePagination<TInput, TOutput>(
  response: AnyListResponse<TInput>,
  items: TOutput[]
): RbacPaginatedResult<TOutput> {
  if (Array.isArray(response)) {
    return {
      items,
      page: 0,
      size: items.length,
      hasNext: false,
      total: items.length,
    };
  }

  return {
    items,
    page: Number(response.page ?? 0),
    size: Number(response.size ?? items.length),
    hasNext: Boolean(response.hasNext),
    total: Number(response.total ?? items.length),
  };
}

function normalizeStatus(input?: string | null, active?: unknown): GlobalAdminUserStatus {
  const normalized = cleanString(input)?.toUpperCase();
  if (normalized === "ATIVO" || normalized === "INATIVO" || normalized === "PENDENTE") {
    return normalized;
  }
  return normalizeBoolean(active, true) ? "ATIVO" : "INATIVO";
}

function normalizeUnitRefs(input?: RawRef[] | null): GlobalAdminUserSummary["academias"] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => {
      const id = cleanString(item.id);
      const nome = cleanString(item.nome) ?? cleanString(item.name);
      return id && nome ? { id, nome } : null;
    })
    .filter((item): item is GlobalAdminUserSummary["academias"][number] => item !== null);
}

function normalizePerfil(raw: RawPerfil): RbacPerfil {
  return {
    id: String(raw.id ?? ""),
    tenantId: cleanString(raw.tenantId) ?? "",
    roleName: cleanString(raw.roleName) ?? cleanString(raw.name) ?? "",
    displayName: cleanString(raw.displayName) ?? cleanString(raw.name) ?? "",
    description: cleanString(raw.description),
    active: normalizeBoolean(raw.active, true),
    createdAt: cleanString(raw.createdAt),
    updatedAt: cleanString(raw.updatedAt),
  };
}

function normalizeMembershipProfile(raw: RawMembershipProfile): GlobalAdminMembershipProfile {
  return {
    perfilId: String(raw.perfilId ?? raw.id ?? ""),
    roleName: cleanString(raw.roleName) ?? cleanString(raw.name) ?? "",
    displayName: cleanString(raw.displayName) ?? cleanString(raw.name) ?? "",
    active: normalizeBoolean(raw.active, true),
    inherited: normalizeBoolean(raw.inherited, false),
  };
}

function normalizeMembershipOrigin(value?: string | null): GlobalAdminMembershipOrigin {
  const normalized = cleanString(value)?.toUpperCase();
  switch (normalized) {
    case "MANUAL":
    case "HERDADO_POLITICA":
    case "PERFIL_ADMIN":
    case "IMPORTACAO":
    case "SISTEMA":
      return normalized;
    case "HERDADO":
    case "POLITICA":
      return "HERDADO_POLITICA";
    case "PERFIL":
      return "PERFIL_ADMIN";
    default:
      return "MANUAL";
  }
}

function normalizePolicyScope(value?: string | null): GlobalAdminNewUnitsPolicyScope {
  const normalized = cleanString(value)?.toUpperCase();
  return normalized === "REDE" ? "REDE" : "ACADEMIA_ATUAL";
}

function normalizeUserSummary(raw: RawUserSummary): GlobalAdminUserSummary {
  const perfis = [...(raw.perfis ?? []), ...(raw.profiles ?? [])]
    .map((item) =>
      typeof item === "string"
        ? cleanString(item)
        : cleanString(item.displayName) ?? cleanString(item.roleName) ?? cleanString(item.name)
    )
    .filter((item): item is string => Boolean(item));

  return {
    id: cleanString(raw.id) ?? cleanString(raw.userId) ?? "",
    name: cleanString(raw.name) ?? cleanString(raw.nome) ?? cleanString(raw.fullName) ?? "",
    fullName: cleanString(raw.fullName),
    email: cleanString(raw.email) ?? "",
    status: normalizeStatus(raw.status, raw.active),
    active: normalizeBoolean(raw.active, normalizeStatus(raw.status, raw.active) === "ATIVO"),
    academias: normalizeUnitRefs(raw.academias ?? raw.units),
    membershipsAtivos: Number(raw.membershipsAtivos ?? raw.activeMemberships ?? 0),
    membershipsTotal: Number(raw.membershipsTotal ?? raw.totalMemberships ?? 0),
    perfis,
    defaultTenantId: cleanString(raw.defaultTenantId) ?? cleanString(raw.defaultUnitId),
    defaultTenantName: cleanString(raw.defaultTenantName) ?? cleanString(raw.defaultUnitName),
    eligibleForNewUnits: normalizeBoolean(raw.eligibleForNewUnits ?? raw.elegivelNovasUnidades, false),
  };
}

function normalizeMembership(raw: RawMembership, userId: string): GlobalAdminMembership {
  const profiles = [...(raw.profiles ?? []), ...(raw.perfis ?? [])].map(normalizeMembershipProfile);
  return {
    id: cleanString(raw.id) ?? cleanString(raw.membershipId) ?? "",
    userId: cleanString(raw.userId) ?? userId,
    tenantId: cleanString(raw.tenantId) ?? cleanString(raw.unidadeId) ?? "",
    tenantName: cleanString(raw.tenantName) ?? cleanString(raw.unidadeNome) ?? "",
    academiaId: cleanString(raw.academiaId) ?? cleanString(raw.groupId),
    academiaName: cleanString(raw.academiaName) ?? cleanString(raw.academiaNome),
    active: normalizeBoolean(raw.active ?? raw.ativo, true),
    defaultTenant: normalizeBoolean(raw.defaultTenant ?? raw.unidadePadrao, false),
    accessOrigin: normalizeMembershipOrigin(raw.accessOrigin ?? raw.origemAcesso),
    inheritedFrom: cleanString(raw.inheritedFrom) ?? cleanString(raw.origemDetalhe),
    eligibleForNewUnits: normalizeBoolean(raw.eligibleForNewUnits ?? raw.elegivelNovasUnidades, false),
    profiles,
    availableProfiles: [...(raw.availableProfiles ?? []), ...(raw.catalogoPerfis ?? [])].map(normalizePerfil),
    createdAt: cleanString(raw.createdAt),
    updatedAt: cleanString(raw.updatedAt),
  };
}

function normalizePolicy(raw?: RawPolicy | null): GlobalAdminNewUnitsPolicy {
  return {
    enabled: normalizeBoolean(raw?.enabled ?? raw?.autoAssignToNewUnits ?? raw?.elegivel, false),
    scope: normalizePolicyScope(raw?.scope ?? raw?.escopo),
    academiaIds: raw?.academiaIds?.map((item) => item.trim()).filter(Boolean),
    inherited: normalizeBoolean(raw?.inherited, false),
    rationale: cleanString(raw?.rationale) ?? cleanString(raw?.motivo),
    updatedAt: cleanString(raw?.updatedAt),
  };
}

function hasUserDetailPayload(value: unknown): value is RawUserDetail {
  return typeof value === "object" && value !== null;
}

async function resolveUserDetailAfterMutation(
  userId: string,
  response?: RawUserDetail | null
): Promise<GlobalAdminUserDetail> {
  if (hasUserDetailPayload(response)) {
    return getGlobalAdminUserDetailFromRaw(response);
  }
  return getGlobalAdminUserDetailApi(userId);
}

export async function getGlobalAdminSecurityOverviewApi(): Promise<GlobalAdminSecurityOverview> {
  const response = await apiRequest<Partial<GlobalAdminSecurityOverview>>({
    path: "/api/v1/admin/seguranca/overview",
  });
  return {
    totalUsers: Number(response.totalUsers ?? 0),
    activeMemberships: Number(response.activeMemberships ?? 0),
    defaultUnitsConfigured: Number(response.defaultUnitsConfigured ?? 0),
    eligibleForNewUnits: Number(response.eligibleForNewUnits ?? 0),
  };
}

export async function listGlobalAdminUsersApi(input: {
  query?: string;
  tenantId?: string;
  academiaId?: string;
  status?: string;
  profile?: string;
  eligibleForNewUnits?: boolean;
  page?: number;
  size?: number;
}): Promise<RbacPaginatedResult<GlobalAdminUserSummary>> {
  const response = await apiRequest<AnyListResponse<RawUserSummary>>({
    path: "/api/v1/admin/seguranca/usuarios",
    query: {
      query: cleanString(input.query),
      tenantId: cleanString(input.tenantId),
      academiaId: cleanString(input.academiaId),
      status: cleanString(input.status),
      profile: cleanString(input.profile),
      eligibleForNewUnits: input.eligibleForNewUnits,
      page: input.page,
      size: input.size,
    },
  });
  const items = normalizeArray(response).map(normalizeUserSummary);
  return normalizePagination(response, items);
}

export async function getGlobalAdminUserDetailApi(userId: string): Promise<GlobalAdminUserDetail> {
  const response = await apiRequest<RawUserDetail>({
    path: `/api/v1/admin/seguranca/usuarios/${userId}`,
  });
  const summary = normalizeUserSummary(response);
  return {
    ...summary,
    createdAt: cleanString(response.createdAt),
    lastLoginAt: cleanString(response.lastLoginAt),
    memberships: (response.memberships ?? []).map((item) => normalizeMembership(item, summary.id)),
    policy: normalizePolicy(response.policy),
  };
}

export async function createGlobalAdminMembershipApi(input: {
  userId: string;
  tenantId: string;
  defaultTenant?: boolean;
}): Promise<GlobalAdminUserDetail> {
  const response = await apiRequest<RawUserDetail | null>({
    path: `/api/v1/admin/seguranca/usuarios/${input.userId}/memberships`,
    method: "POST",
    body: {
      tenantId: input.tenantId,
      defaultTenant: input.defaultTenant ?? false,
    },
  });
  return resolveUserDetailAfterMutation(input.userId, response);
}

export async function updateGlobalAdminMembershipApi(input: {
  userId: string;
  membershipId: string;
  active?: boolean;
  defaultTenant?: boolean;
}): Promise<GlobalAdminUserDetail> {
  const response = await apiRequest<RawUserDetail | null>({
    path: `/api/v1/admin/seguranca/usuarios/${input.userId}/memberships/${input.membershipId}`,
    method: "PATCH",
    body: {
      active: input.active,
      defaultTenant: input.defaultTenant,
    },
  });
  return resolveUserDetailAfterMutation(input.userId, response);
}

export async function deleteGlobalAdminMembershipApi(input: {
  userId: string;
  membershipId: string;
}): Promise<GlobalAdminUserDetail> {
  const response = await apiRequest<RawUserDetail | null>({
    path: `/api/v1/admin/seguranca/usuarios/${input.userId}/memberships/${input.membershipId}`,
    method: "DELETE",
  });
  return resolveUserDetailAfterMutation(input.userId, response);
}

export async function assignGlobalAdminMembershipProfileApi(input: {
  userId: string;
  membershipId: string;
  perfilId: string;
}): Promise<GlobalAdminUserDetail> {
  const response = await apiRequest<RawUserDetail | null>({
    path: `/api/v1/admin/seguranca/usuarios/${input.userId}/memberships/${input.membershipId}/perfis/${input.perfilId}`,
    method: "PUT",
  });
  return resolveUserDetailAfterMutation(input.userId, response);
}

export async function removeGlobalAdminMembershipProfileApi(input: {
  userId: string;
  membershipId: string;
  perfilId: string;
}): Promise<GlobalAdminUserDetail> {
  const response = await apiRequest<RawUserDetail | null>({
    path: `/api/v1/admin/seguranca/usuarios/${input.userId}/memberships/${input.membershipId}/perfis/${input.perfilId}`,
    method: "DELETE",
  });
  return resolveUserDetailAfterMutation(input.userId, response);
}

export async function updateGlobalAdminNewUnitsPolicyApi(input: {
  userId: string;
  enabled: boolean;
  scope: GlobalAdminNewUnitsPolicyScope;
  academiaIds?: string[];
  rationale?: string;
}): Promise<GlobalAdminUserDetail> {
  const response = await apiRequest<RawUserDetail | null>({
    path: `/api/v1/admin/seguranca/usuarios/${input.userId}/policy/new-units`,
    method: "PUT",
    body: {
      enabled: input.enabled,
      scope: input.scope,
      academiaIds: input.academiaIds,
      rationale: cleanString(input.rationale),
    },
  });
  return resolveUserDetailAfterMutation(input.userId, response);
}

function getGlobalAdminUserDetailFromRaw(response: RawUserDetail): GlobalAdminUserDetail {
  const summary = normalizeUserSummary(response);
  return {
    ...summary,
    createdAt: cleanString(response.createdAt),
    lastLoginAt: cleanString(response.lastLoginAt),
    memberships: (response.memberships ?? []).map((item) => normalizeMembership(item, summary.id)),
    policy: normalizePolicy(response.policy),
  };
}
