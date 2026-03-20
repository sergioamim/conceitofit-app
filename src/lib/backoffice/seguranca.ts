import type {
  GlobalAdminReviewBoard,
  GlobalAdminNewUnitsPolicyScope,
  GlobalAdminSecurityOverview,
  GlobalAdminUserDetail,
  GlobalAdminUserSummary,
  RbacPaginatedResult,
} from "@/lib/types";
import {
  assignGlobalAdminMembershipProfileApi,
  createGlobalAdminAccessExceptionApi,
  createGlobalAdminMembershipApi,
  deleteGlobalAdminAccessExceptionApi,
  deleteGlobalAdminMembershipApi,
  getGlobalAdminReviewBoardApi,
  getGlobalAdminSecurityOverviewApi,
  getGlobalAdminUserDetailApi,
  listGlobalAdminUsersApi,
  removeGlobalAdminMembershipProfileApi,
  updateGlobalAdminMembershipApi,
  updateGlobalAdminNewUnitsPolicyApi,
} from "@/lib/api/backoffice-seguranca";

function trimString(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export async function getGlobalSecurityOverview(): Promise<GlobalAdminSecurityOverview> {
  return getGlobalAdminSecurityOverviewApi();
}

export async function listGlobalSecurityUsers(input: {
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
  return listGlobalAdminUsersApi({
    query: trimString(input.query),
    tenantId: trimString(input.tenantId),
    academiaId: trimString(input.academiaId),
    status: trimString(input.status),
    profile: trimString(input.profile),
    scopeType: trimString(input.scopeType),
    eligibleForNewUnits: input.eligibleForNewUnits,
    page: input.page,
    size: input.size,
  });
}

export async function getGlobalSecurityUser(userId: string): Promise<GlobalAdminUserDetail> {
  const normalizedUserId = trimString(userId);
  if (!normalizedUserId) {
    throw new Error("Usuário inválido para consulta.");
  }
  return getGlobalAdminUserDetailApi(normalizedUserId);
}

export async function addUserMembership(input: {
  userId: string;
  tenantId: string;
  defaultTenant?: boolean;
}): Promise<GlobalAdminUserDetail> {
  const userId = trimString(input.userId);
  const tenantId = trimString(input.tenantId);
  if (!userId || !tenantId) {
    throw new Error("Usuário e unidade são obrigatórios.");
  }
  return createGlobalAdminMembershipApi({
    userId,
    tenantId,
    defaultTenant: input.defaultTenant ?? false,
  });
}

export async function updateUserMembership(input: {
  userId: string;
  membershipId: string;
  active?: boolean;
  defaultTenant?: boolean;
}): Promise<GlobalAdminUserDetail> {
  const userId = trimString(input.userId);
  const membershipId = trimString(input.membershipId);
  if (!userId || !membershipId) {
    throw new Error("Membership inválido.");
  }
  return updateGlobalAdminMembershipApi({
    userId,
    membershipId,
    active: input.active,
    defaultTenant: input.defaultTenant,
  });
}

export async function removeUserMembership(input: {
  userId: string;
  membershipId: string;
}): Promise<GlobalAdminUserDetail> {
  const userId = trimString(input.userId);
  const membershipId = trimString(input.membershipId);
  if (!userId || !membershipId) {
    throw new Error("Membership inválido.");
  }
  return deleteGlobalAdminMembershipApi({ userId, membershipId });
}

export async function assignUserMembershipProfile(input: {
  userId: string;
  membershipId: string;
  perfilId: string;
}): Promise<GlobalAdminUserDetail> {
  const userId = trimString(input.userId);
  const membershipId = trimString(input.membershipId);
  const perfilId = trimString(input.perfilId);
  if (!userId || !membershipId || !perfilId) {
    throw new Error("Perfil e membership são obrigatórios.");
  }
  return assignGlobalAdminMembershipProfileApi({ userId, membershipId, perfilId });
}

export async function removeUserMembershipProfile(input: {
  userId: string;
  membershipId: string;
  perfilId: string;
}): Promise<GlobalAdminUserDetail> {
  const userId = trimString(input.userId);
  const membershipId = trimString(input.membershipId);
  const perfilId = trimString(input.perfilId);
  if (!userId || !membershipId || !perfilId) {
    throw new Error("Perfil e membership são obrigatórios.");
  }
  return removeGlobalAdminMembershipProfileApi({ userId, membershipId, perfilId });
}

export async function updateUserNewUnitsPolicy(input: {
  userId: string;
  enabled: boolean;
  scope: GlobalAdminNewUnitsPolicyScope;
  academiaIds?: string[];
  rationale?: string;
}): Promise<GlobalAdminUserDetail> {
  const userId = trimString(input.userId);
  if (!userId) {
    throw new Error("Usuário inválido para política de novas unidades.");
  }
  return updateGlobalAdminNewUnitsPolicyApi({
    userId,
    enabled: input.enabled,
    scope: input.scope,
    academiaIds: input.academiaIds?.map((item) => item.trim()).filter(Boolean),
    rationale: trimString(input.rationale),
  });
}

export async function createUserAccessException(input: {
  userId: string;
  membershipId?: string;
  title: string;
  scopeLabel?: string;
  justification: string;
  expiresAt?: string;
}): Promise<GlobalAdminUserDetail> {
  const userId = trimString(input.userId);
  const title = trimString(input.title);
  const justification = trimString(input.justification);
  if (!userId || !title || !justification) {
    throw new Error("Usuário, título e justificativa são obrigatórios.");
  }
  return createGlobalAdminAccessExceptionApi({
    userId,
    membershipId: trimString(input.membershipId),
    title,
    scopeLabel: trimString(input.scopeLabel),
    justification,
    expiresAt: trimString(input.expiresAt),
  });
}

export async function removeUserAccessException(input: {
  userId: string;
  exceptionId: string;
}): Promise<GlobalAdminUserDetail> {
  const userId = trimString(input.userId);
  const exceptionId = trimString(input.exceptionId);
  if (!userId || !exceptionId) {
    throw new Error("Exceção inválida.");
  }
  return deleteGlobalAdminAccessExceptionApi({ userId, exceptionId });
}

export async function getGlobalSecurityReviewBoard(): Promise<GlobalAdminReviewBoard> {
  return getGlobalAdminReviewBoardApi();
}

export async function listEligibleNewUnitAdminsPreview(input?: {
  academiaId?: string;
  size?: number;
}): Promise<RbacPaginatedResult<GlobalAdminUserSummary>> {
  return listGlobalAdminUsersApi({
    academiaId: trimString(input?.academiaId),
    eligibleForNewUnits: true,
    page: 0,
    size: input?.size ?? 5,
  });
}
