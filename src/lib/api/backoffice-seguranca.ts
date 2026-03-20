import type {
  GlobalAdminAccessException,
  GlobalAdminMembership,
  GlobalAdminMembershipOrigin,
  GlobalAdminMembershipProfile,
  GlobalAdminNewUnitsPolicy,
  GlobalAdminNewUnitsPolicyScope,
  GlobalAdminRecentChange,
  GlobalAdminReviewBoard,
  GlobalAdminReviewBoardItem,
  GlobalAdminReviewStatus,
  GlobalAdminRiskLevel,
  GlobalAdminSecurityOverview,
  GlobalAdminScopeType,
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
  redeId?: string | null;
  redeNome?: string | null;
  redeSlug?: string | null;
  scopeType?: string | null;
  tipoEscopo?: string | null;
  academiaId?: string | null;
  groupId?: string | null;
  academiaName?: string | null;
  academiaNome?: string | null;
  tenantBaseId?: string | null;
  tenantBaseName?: string | null;
  unidadeBaseId?: string | null;
  unidadeBaseNome?: string | null;
  activeTenantId?: string | null;
  activeTenantName?: string | null;
  unidadeAtivaId?: string | null;
  unidadeAtivaNome?: string | null;
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
  sourceLabel?: string | null;
  origemLabel?: string | null;
  updatedAt?: string | null;
};

type RawException = {
  id?: string | null;
  title?: string | null;
  titulo?: string | null;
  scopeLabel?: string | null;
  escopoLabel?: string | null;
  justification?: string | null;
  justificativa?: string | null;
  expiresAt?: string | null;
  expiraEm?: string | null;
  createdAt?: string | null;
  criadoEm?: string | null;
  createdBy?: string | null;
  criadoPor?: string | null;
  active?: unknown;
  ativo?: unknown;
};

type RawRecentChange = {
  id?: string | null;
  title?: string | null;
  titulo?: string | null;
  description?: string | null;
  descricao?: string | null;
  happenedAt?: string | null;
  ocorreuEm?: string | null;
  actorName?: string | null;
  autorNome?: string | null;
  severity?: string | null;
  criticidade?: string | null;
};

type RawReviewItem = {
  id?: string | null;
  userId?: string | null;
  usuarioId?: string | null;
  userName?: string | null;
  usuarioNome?: string | null;
  title?: string | null;
  titulo?: string | null;
  description?: string | null;
  descricao?: string | null;
  severity?: string | null;
  criticidade?: string | null;
  dueAt?: string | null;
  prazoEm?: string | null;
  category?: string | null;
  categoria?: string | null;
};

type RawLoginIdentifier = {
  label?: string | null;
  rotulo?: string | null;
  type?: string | null;
  tipo?: string | null;
  value?: string | null;
  valor?: string | null;
  maskedValue?: string | null;
  valorMascarado?: string | null;
};

type RawUserSummary = {
  id?: string | null;
  userId?: string | null;
  name?: string | null;
  nome?: string | null;
  fullName?: string | null;
  email?: string | null;
  userKind?: string | null;
  redeId?: string | null;
  redeNome?: string | null;
  redeSlug?: string | null;
  scopeType?: string | null;
  effectiveScope?: string | null;
  tipoEscopo?: string | null;
  loginIdentifiers?: RawLoginIdentifier[] | null;
  identificadoresLogin?: RawLoginIdentifier[] | null;
  identifiers?: RawLoginIdentifier[] | null;
  domainLinksSummary?: string[] | null;
  vinculosDominioResumo?: string[] | null;
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
  activeTenantId?: string | null;
  activeTenantName?: string | null;
  unidadeAtivaId?: string | null;
  unidadeAtivaNome?: string | null;
  eligibleForNewUnits?: unknown;
  elegivelNovasUnidades?: unknown;
  broadAccess?: unknown;
  acessoAmplo?: unknown;
  compatibilityMode?: unknown;
  modoCompatibilidade?: unknown;
  riskLevel?: string | null;
  nivelRisco?: string | null;
  riskFlags?: string[] | null;
  alertasRisco?: string[] | null;
  exceptionsCount?: number | null;
  totalExcecoes?: number | null;
  reviewStatus?: string | null;
  statusRevisao?: string | null;
  nextReviewAt?: string | null;
  proximaRevisaoEm?: string | null;
};

type RawUserDetail = RawUserSummary & {
  createdAt?: string | null;
  lastLoginAt?: string | null;
  memberships?: RawMembership[] | null;
  policy?: RawPolicy | null;
  exceptions?: RawException[] | null;
  excecoes?: RawException[] | null;
  recentChanges?: RawRecentChange[] | null;
  mudancasRecentes?: RawRecentChange[] | null;
};

type RawReviewBoard = {
  pendingReviews?: RawReviewItem[] | null;
  revisoesPendentes?: RawReviewItem[] | null;
  expiringExceptions?: RawReviewItem[] | null;
  excecoesExpirando?: RawReviewItem[] | null;
  recentChanges?: RawReviewItem[] | null;
  mudancasRecentes?: RawReviewItem[] | null;
  broadAccess?: RawReviewItem[] | null;
  acessosAmplos?: RawReviewItem[] | null;
  orphanProfiles?: RawReviewItem[] | null;
  perfisSemDono?: RawReviewItem[] | null;
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

function normalizeRiskLevel(value?: string | null): GlobalAdminRiskLevel | undefined {
  const normalized = cleanString(value)?.toUpperCase();
  if (normalized === "BAIXO" || normalized === "MEDIO" || normalized === "ALTO" || normalized === "CRITICO") {
    return normalized;
  }
  return undefined;
}

function normalizeReviewStatus(value?: string | null): GlobalAdminReviewStatus | undefined {
  const normalized = cleanString(value)?.toUpperCase();
  if (normalized === "EM_DIA" || normalized === "PENDENTE" || normalized === "VENCIDA") {
    return normalized;
  }
  return undefined;
}

function normalizeScopeType(value?: string | null): GlobalAdminScopeType | undefined {
  const normalized = cleanString(value)?.toUpperCase();
  if (normalized === "UNIDADE" || normalized === "REDE" || normalized === "GLOBAL") {
    return normalized;
  }
  return undefined;
}

function normalizeLoginIdentifiers(input: RawLoginIdentifier[] | null | undefined) {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => {
      const label =
        cleanString(item.label)
        ?? cleanString(item.rotulo)
        ?? cleanString(item.type)
        ?? cleanString(item.tipo)
        ?? "Identificador";
      const value =
        cleanString(item.maskedValue)
        ?? cleanString(item.valorMascarado)
        ?? cleanString(item.value)
        ?? cleanString(item.valor);
      return value ? { label, value } : null;
    })
    .filter((item): item is NonNullable<GlobalAdminUserSummary["loginIdentifiers"]>[number] => item !== null);
}

function normalizeDomainLinksSummary(input?: string[] | null): string[] {
  if (!Array.isArray(input)) return [];
  return input.map((item) => item.trim()).filter(Boolean);
}

function normalizeAccessException(raw: RawException): GlobalAdminAccessException {
  return {
    id: cleanString(raw.id) ?? "",
    title: cleanString(raw.title) ?? cleanString(raw.titulo) ?? "Exceção sem título",
    scopeLabel: cleanString(raw.scopeLabel) ?? cleanString(raw.escopoLabel),
    justification: cleanString(raw.justification) ?? cleanString(raw.justificativa) ?? "",
    expiresAt: cleanString(raw.expiresAt) ?? cleanString(raw.expiraEm),
    createdAt: cleanString(raw.createdAt) ?? cleanString(raw.criadoEm),
    createdBy: cleanString(raw.createdBy) ?? cleanString(raw.criadoPor),
    active: normalizeBoolean(raw.active ?? raw.ativo, true),
  };
}

function normalizeRecentChange(raw: RawRecentChange): GlobalAdminRecentChange {
  return {
    id: cleanString(raw.id) ?? "",
    title: cleanString(raw.title) ?? cleanString(raw.titulo) ?? "Mudança",
    description: cleanString(raw.description) ?? cleanString(raw.descricao),
    happenedAt: cleanString(raw.happenedAt) ?? cleanString(raw.ocorreuEm),
    actorName: cleanString(raw.actorName) ?? cleanString(raw.autorNome),
    severity: normalizeRiskLevel(raw.severity ?? raw.criticidade),
  };
}

function normalizeReviewCategory(value?: string | null): GlobalAdminReviewBoardItem["category"] {
  const normalized = cleanString(value)?.toUpperCase();
  switch (normalized) {
    case "REVISAO_PENDENTE":
    case "EXCECAO_EXPIRANDO":
    case "MUDANCA_RECENTE":
    case "ACESSO_AMPLO":
    case "PERFIL_SEM_DONO":
      return normalized;
    default:
      return "REVISAO_PENDENTE";
  }
}

function normalizeReviewItem(raw: RawReviewItem): GlobalAdminReviewBoardItem {
  return {
    id: cleanString(raw.id) ?? "",
    userId: cleanString(raw.userId) ?? cleanString(raw.usuarioId),
    userName: cleanString(raw.userName) ?? cleanString(raw.usuarioNome) ?? "Usuário",
    title: cleanString(raw.title) ?? cleanString(raw.titulo) ?? "Item de revisão",
    description: cleanString(raw.description) ?? cleanString(raw.descricao),
    severity: normalizeRiskLevel(raw.severity ?? raw.criticidade) ?? "MEDIO",
    dueAt: cleanString(raw.dueAt) ?? cleanString(raw.prazoEm),
    category: normalizeReviewCategory(raw.category ?? raw.categoria),
  };
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
    userKind: cleanString(raw.userKind),
    networkId: cleanString(raw.redeId),
    networkName: cleanString(raw.redeNome),
    networkSlug: cleanString(raw.redeSlug),
    scopeType: normalizeScopeType(raw.scopeType ?? raw.effectiveScope ?? raw.tipoEscopo),
    loginIdentifiers: normalizeLoginIdentifiers([
      ...(raw.loginIdentifiers ?? []),
      ...(raw.identificadoresLogin ?? []),
      ...(raw.identifiers ?? []),
    ]),
    domainLinksSummary: normalizeDomainLinksSummary([
      ...(raw.domainLinksSummary ?? []),
      ...(raw.vinculosDominioResumo ?? []),
    ]),
    status: normalizeStatus(raw.status, raw.active),
    active: normalizeBoolean(raw.active, normalizeStatus(raw.status, raw.active) === "ATIVO"),
    academias: normalizeUnitRefs(raw.academias ?? raw.units),
    membershipsAtivos: Number(raw.membershipsAtivos ?? raw.activeMemberships ?? 0),
    membershipsTotal: Number(raw.membershipsTotal ?? raw.totalMemberships ?? 0),
    perfis,
    defaultTenantId: cleanString(raw.defaultTenantId) ?? cleanString(raw.defaultUnitId),
    defaultTenantName: cleanString(raw.defaultTenantName) ?? cleanString(raw.defaultUnitName),
    activeTenantId: cleanString(raw.activeTenantId) ?? cleanString(raw.unidadeAtivaId),
    activeTenantName: cleanString(raw.activeTenantName) ?? cleanString(raw.unidadeAtivaNome),
    eligibleForNewUnits: normalizeBoolean(raw.eligibleForNewUnits ?? raw.elegivelNovasUnidades, false),
    broadAccess: normalizeBoolean(raw.broadAccess ?? raw.acessoAmplo, false),
    compatibilityMode: normalizeBoolean(raw.compatibilityMode ?? raw.modoCompatibilidade, false),
    riskLevel: normalizeRiskLevel(raw.riskLevel ?? raw.nivelRisco),
    riskFlags: [...(raw.riskFlags ?? []), ...(raw.alertasRisco ?? [])].map((item) => item.trim()).filter(Boolean),
    exceptionsCount: Number(raw.exceptionsCount ?? raw.totalExcecoes ?? 0),
    reviewStatus: normalizeReviewStatus(raw.reviewStatus ?? raw.statusRevisao),
    nextReviewAt: cleanString(raw.nextReviewAt) ?? cleanString(raw.proximaRevisaoEm),
  };
}

function normalizeMembership(raw: RawMembership, userId: string): GlobalAdminMembership {
  const profiles = [...(raw.profiles ?? []), ...(raw.perfis ?? [])].map(normalizeMembershipProfile);
  return {
    id: cleanString(raw.id) ?? cleanString(raw.membershipId) ?? "",
    userId: cleanString(raw.userId) ?? userId,
    tenantId: cleanString(raw.tenantId) ?? cleanString(raw.unidadeId) ?? "",
    tenantName: cleanString(raw.tenantName) ?? cleanString(raw.unidadeNome) ?? "",
    networkId: cleanString(raw.redeId),
    networkName: cleanString(raw.redeNome),
    networkSlug: cleanString(raw.redeSlug),
    scopeType: normalizeScopeType(raw.scopeType ?? raw.tipoEscopo),
    academiaId: cleanString(raw.academiaId) ?? cleanString(raw.groupId),
    academiaName: cleanString(raw.academiaName) ?? cleanString(raw.academiaNome),
    active: normalizeBoolean(raw.active ?? raw.ativo, true),
    defaultTenant: normalizeBoolean(raw.defaultTenant ?? raw.unidadePadrao, false),
    accessOrigin: normalizeMembershipOrigin(raw.accessOrigin ?? raw.origemAcesso),
    inheritedFrom: cleanString(raw.inheritedFrom) ?? cleanString(raw.origemDetalhe),
    tenantBaseId: cleanString(raw.tenantBaseId) ?? cleanString(raw.unidadeBaseId),
    tenantBaseName: cleanString(raw.tenantBaseName) ?? cleanString(raw.unidadeBaseNome),
    activeTenantId: cleanString(raw.activeTenantId) ?? cleanString(raw.unidadeAtivaId),
    activeTenantName: cleanString(raw.activeTenantName) ?? cleanString(raw.unidadeAtivaNome),
    eligibleForNewUnits: normalizeBoolean(raw.eligibleForNewUnits ?? raw.elegivelNovasUnidades, false),
    profiles,
    availableProfiles: [...(raw.availableProfiles ?? []), ...(raw.catalogoPerfis ?? [])].map(normalizePerfil),
    riskLevel: normalizeRiskLevel((raw as RawMembership & { riskLevel?: string | null; nivelRisco?: string | null }).riskLevel ?? (raw as RawMembership & { nivelRisco?: string | null }).nivelRisco),
    riskFlags: [
      ...(((raw as RawMembership & { riskFlags?: string[] | null }).riskFlags) ?? []),
      ...(((raw as RawMembership & { alertasRisco?: string[] | null }).alertasRisco) ?? []),
    ].map((item) => item.trim()).filter(Boolean),
    broadAccess: normalizeBoolean((raw as RawMembership & { broadAccess?: unknown; acessoAmplo?: unknown }).broadAccess ?? (raw as RawMembership & { acessoAmplo?: unknown }).acessoAmplo, false),
    reviewStatus: normalizeReviewStatus((raw as RawMembership & { reviewStatus?: string | null; statusRevisao?: string | null }).reviewStatus ?? (raw as RawMembership & { statusRevisao?: string | null }).statusRevisao),
    nextReviewAt: cleanString((raw as RawMembership & { nextReviewAt?: string | null; proximaRevisaoEm?: string | null }).nextReviewAt) ?? cleanString((raw as RawMembership & { proximaRevisaoEm?: string | null }).proximaRevisaoEm),
    exceptions: [
      ...(((raw as RawMembership & { exceptions?: RawException[] | null }).exceptions) ?? []),
      ...(((raw as RawMembership & { excecoes?: RawException[] | null }).excecoes) ?? []),
    ].map(normalizeAccessException),
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
    sourceLabel: cleanString(raw?.sourceLabel) ?? cleanString(raw?.origemLabel),
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
    broadAccessUsers: Number(response.broadAccessUsers ?? 0),
    expiringExceptions: Number(response.expiringExceptions ?? 0),
    pendingReviews: Number(response.pendingReviews ?? 0),
    rolloutPercentage: Number(response.rolloutPercentage ?? 0),
    compatibilityModeUsers: Number(response.compatibilityModeUsers ?? 0),
  };
}

export async function listGlobalAdminUsersApi(input: {
  query?: string;
  tenantId?: string;
  academiaId?: string;
  status?: string;
  profile?: string;
  scopeType?: string;
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
      scopeType: cleanString(input.scopeType),
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
    exceptions: [...(response.exceptions ?? []), ...(response.excecoes ?? [])].map(normalizeAccessException),
    recentChanges: [...(response.recentChanges ?? []), ...(response.mudancasRecentes ?? [])].map(normalizeRecentChange),
  };
}

export async function createGlobalAdminAccessExceptionApi(input: {
  userId: string;
  membershipId?: string;
  title: string;
  scopeLabel?: string;
  justification: string;
  expiresAt?: string;
}): Promise<GlobalAdminUserDetail> {
  const response = await apiRequest<RawUserDetail | null>({
    path: `/api/v1/admin/seguranca/usuarios/${input.userId}/exceptions`,
    method: "POST",
    body: {
      membershipId: input.membershipId,
      title: cleanString(input.title),
      scopeLabel: cleanString(input.scopeLabel),
      justification: cleanString(input.justification),
      expiresAt: cleanString(input.expiresAt),
    },
  });
  return resolveUserDetailAfterMutation(input.userId, response);
}

export async function deleteGlobalAdminAccessExceptionApi(input: {
  userId: string;
  exceptionId: string;
}): Promise<GlobalAdminUserDetail> {
  const response = await apiRequest<RawUserDetail | null>({
    path: `/api/v1/admin/seguranca/usuarios/${input.userId}/exceptions/${input.exceptionId}`,
    method: "DELETE",
  });
  return resolveUserDetailAfterMutation(input.userId, response);
}

export async function getGlobalAdminReviewBoardApi(): Promise<GlobalAdminReviewBoard> {
  const response = await apiRequest<RawReviewBoard>({
    path: "/api/v1/admin/seguranca/reviews",
  });
  return {
    pendingReviews: [...(response.pendingReviews ?? []), ...(response.revisoesPendentes ?? [])].map(normalizeReviewItem),
    expiringExceptions: [...(response.expiringExceptions ?? []), ...(response.excecoesExpirando ?? [])].map(normalizeReviewItem),
    recentChanges: [...(response.recentChanges ?? []), ...(response.mudancasRecentes ?? [])].map(normalizeReviewItem),
    broadAccess: [...(response.broadAccess ?? []), ...(response.acessosAmplos ?? [])].map(normalizeReviewItem),
    orphanProfiles: [...(response.orphanProfiles ?? []), ...(response.perfisSemDono ?? [])].map(normalizeReviewItem),
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
    exceptions: [...(response.exceptions ?? []), ...(response.excecoes ?? [])].map(normalizeAccessException),
    recentChanges: [...(response.recentChanges ?? []), ...(response.mudancasRecentes ?? [])].map(normalizeRecentChange),
  };
}
