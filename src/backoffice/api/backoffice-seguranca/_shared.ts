import type {
  GlobalAdminAccessException,
  GlobalAdminMembership,
  GlobalAdminMembershipOrigin,
  GlobalAdminMembershipProfile,
  GlobalAdminNewUnitsPolicy,
  GlobalAdminNewUnitsPolicyScope,
  GlobalAdminRecentChange,
  GlobalAdminReviewBoardItem,
  GlobalAdminReviewStatus,
  GlobalAdminRiskLevel,
  GlobalAdminScopeType,
  GlobalAdminUserDetail,
  GlobalAdminUserStatus,
  GlobalAdminUserSummary,
  RbacPaginatedResult,
  RbacPerfil,
} from "@/lib/types";

export type AnyListResponse<T> =
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

export type RawRef = {
  id?: string | null;
  nome?: string | null;
  name?: string | null;
};

export type RawPerfil = {
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

export type RawMembershipProfile = {
  perfilId?: string | number | null;
  id?: string | number | null;
  roleName?: string | null;
  name?: string | null;
  displayName?: string | null;
  active?: unknown;
  inherited?: unknown;
};

export type RawMembership = {
  id?: string | null;
  membershipId?: string | null;
  userId?: string | null;
  tenantId?: string | null;
  unidadeId?: string | null;
  tenantName?: string | null;
  unidadeNome?: string | null;
  redeId?: string | null;
  redeNome?: string | null;
  redeSubdominio?: string | null;
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

export type RawPolicy = {
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

export type RawException = {
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

export type RawRecentChange = {
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

export type RawReviewItem = {
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

export type RawLoginIdentifier = {
  label?: string | null;
  rotulo?: string | null;
  type?: string | null;
  tipo?: string | null;
  value?: string | null;
  valor?: string | null;
  maskedValue?: string | null;
  valorMascarado?: string | null;
};

export type RawUserSummary = {
  id?: string | null;
  userId?: string | null;
  name?: string | null;
  nome?: string | null;
  fullName?: string | null;
  email?: string | null;
  userKind?: string | null;
  redeId?: string | null;
  redeNome?: string | null;
  redeSubdominio?: string | null;
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

export type RawUserDetail = RawUserSummary & {
  createdAt?: string | null;
  lastLoginAt?: string | null;
  memberships?: RawMembership[] | null;
  policy?: RawPolicy | null;
  exceptions?: RawException[] | null;
  excecoes?: RawException[] | null;
  recentChanges?: RawRecentChange[] | null;
  mudancasRecentes?: RawRecentChange[] | null;
};

export type RawReviewBoard = {
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

export function cleanString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

export function normalizeBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "sim", "ativo", "enabled"].includes(normalized)) return true;
    if (["false", "0", "nao", "não", "inativo", "disabled"].includes(normalized)) return false;
  }
  return fallback;
}

export function normalizeArray<T>(response: AnyListResponse<T>): T[] {
  if (Array.isArray(response)) return response;
  return response.items ?? response.content ?? response.data ?? response.rows ?? response.result ?? [];
}

export function normalizePagination<TInput, TOutput>(
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

export function normalizeStatus(input?: string | null, active?: unknown): GlobalAdminUserStatus {
  const normalized = cleanString(input)?.toUpperCase();
  if (normalized === "ATIVO" || normalized === "INATIVO" || normalized === "PENDENTE") {
    return normalized;
  }
  return normalizeBoolean(active, true) ? "ATIVO" : "INATIVO";
}

export function normalizeUnitRefs(input?: RawRef[] | null): GlobalAdminUserSummary["academias"] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => {
      const id = cleanString(item.id);
      const nome = cleanString(item.nome) ?? cleanString(item.name);
      return id && nome ? { id, nome } : null;
    })
    .filter((item): item is GlobalAdminUserSummary["academias"][number] => item !== null);
}

export function normalizePerfil(raw: RawPerfil): RbacPerfil {
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

export function normalizeMembershipProfile(raw: RawMembershipProfile): GlobalAdminMembershipProfile {
  return {
    perfilId: String(raw.perfilId ?? raw.id ?? ""),
    roleName: cleanString(raw.roleName) ?? cleanString(raw.name) ?? "",
    displayName: cleanString(raw.displayName) ?? cleanString(raw.name) ?? "",
    active: normalizeBoolean(raw.active, true),
    inherited: normalizeBoolean(raw.inherited, false),
  };
}

export function normalizeMembershipOrigin(value?: string | null): GlobalAdminMembershipOrigin {
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

export function normalizePolicyScope(value?: string | null): GlobalAdminNewUnitsPolicyScope {
  const normalized = cleanString(value)?.toUpperCase();
  return normalized === "REDE" ? "REDE" : "ACADEMIA_ATUAL";
}

export function normalizeRiskLevel(value?: string | null): GlobalAdminRiskLevel | undefined {
  const normalized = cleanString(value)?.toUpperCase();
  if (normalized === "BAIXO" || normalized === "MEDIO" || normalized === "ALTO" || normalized === "CRITICO") {
    return normalized;
  }
  return undefined;
}

export function normalizeReviewStatus(value?: string | null): GlobalAdminReviewStatus | undefined {
  const normalized = cleanString(value)?.toUpperCase();
  if (normalized === "EM_DIA" || normalized === "PENDENTE" || normalized === "VENCIDA") {
    return normalized;
  }
  return undefined;
}

export function normalizeScopeType(value?: string | null): GlobalAdminScopeType | undefined {
  const normalized = cleanString(value)?.toUpperCase();
  if (normalized === "UNIDADE" || normalized === "REDE" || normalized === "GLOBAL") {
    return normalized;
  }
  return undefined;
}

export function normalizeLoginIdentifiers(input: RawLoginIdentifier[] | null | undefined) {
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

export function normalizeDomainLinksSummary(input?: string[] | null): string[] {
  if (!Array.isArray(input)) return [];
  return input.map((item) => item.trim()).filter(Boolean);
}

export function normalizeAccessException(raw: RawException): GlobalAdminAccessException {
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

export function normalizeRecentChange(raw: RawRecentChange): GlobalAdminRecentChange {
  return {
    id: cleanString(raw.id) ?? "",
    title: cleanString(raw.title) ?? cleanString(raw.titulo) ?? "Mudança",
    description: cleanString(raw.description) ?? cleanString(raw.descricao),
    happenedAt: cleanString(raw.happenedAt) ?? cleanString(raw.ocorreuEm),
    actorName: cleanString(raw.actorName) ?? cleanString(raw.autorNome),
    severity: normalizeRiskLevel(raw.severity ?? raw.criticidade),
  };
}

export function normalizeReviewCategory(value?: string | null): GlobalAdminReviewBoardItem["category"] {
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

export function normalizeReviewItem(raw: RawReviewItem): GlobalAdminReviewBoardItem {
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

export function normalizeUserSummary(raw: RawUserSummary): GlobalAdminUserSummary {
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
    networkSubdomain: cleanString(raw.redeSubdominio) ?? cleanString(raw.redeSlug),
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

export function normalizeMembership(raw: RawMembership, userId: string): GlobalAdminMembership {
  const profiles = [...(raw.profiles ?? []), ...(raw.perfis ?? [])].map(normalizeMembershipProfile);
  return {
    id: cleanString(raw.id) ?? cleanString(raw.membershipId) ?? "",
    userId: cleanString(raw.userId) ?? userId,
    tenantId: cleanString(raw.tenantId) ?? cleanString(raw.unidadeId) ?? "",
    tenantName: cleanString(raw.tenantName) ?? cleanString(raw.unidadeNome) ?? "",
    networkId: cleanString(raw.redeId),
    networkName: cleanString(raw.redeNome),
    networkSubdomain: cleanString(raw.redeSubdominio) ?? cleanString(raw.redeSlug),
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

export function normalizePolicy(raw?: RawPolicy | null): GlobalAdminNewUnitsPolicy {
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

export function hasUserDetailPayload(value: unknown): value is RawUserDetail {
  return typeof value === "object" && value !== null;
}

export function getGlobalAdminUserDetailFromRaw(response: RawUserDetail): GlobalAdminUserDetail {
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
