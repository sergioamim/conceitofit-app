import type {
  GlobalAdminUserCreatePayload,
  GlobalAdminSecurityOverview,
  GlobalAdminUserDetail,
  GlobalAdminUserSummary,
  RbacPaginatedResult,
} from "@/lib/types";
import { apiRequest } from "../http";
import type { AnyListResponse, RawUserDetail, RawUserSummary } from "./_shared";
import {
  cleanString,
  getGlobalAdminUserDetailFromRaw,
  normalizeArray,
  normalizePagination,
  normalizeUserSummary,
} from "./_shared";

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
  return getGlobalAdminUserDetailFromRaw(response);
}

export async function createGlobalAdminUserApi(
  input: GlobalAdminUserCreatePayload
): Promise<GlobalAdminUserDetail> {
  const response = await apiRequest<RawUserDetail>({
    path: "/api/v1/admin/seguranca/usuarios",
    method: "POST",
    body: {
      name: cleanString(input.name),
      fullName: cleanString(input.fullName),
      email: cleanString(input.email),
      userKind: cleanString(input.userKind),
      scopeType: cleanString(input.scopeType),
      academiaId: cleanString(input.academiaId),
      tenantIds: input.tenantIds?.map((item) => item.trim()).filter(Boolean),
      defaultTenantId: cleanString(input.defaultTenantId),
      broadAccess: input.broadAccess ?? false,
      eligibleForNewUnits: input.eligibleForNewUnits ?? false,
      policyScope: cleanString(input.policyScope),
      loginIdentifiers: input.loginIdentifiers
        ?.map((item) => ({
          label: cleanString(item.label),
          value: cleanString(item.value),
        }))
        .filter((item): item is { label: string; value: string } => Boolean(item.label && item.value)),
    },
  });
  return getGlobalAdminUserDetailFromRaw(response);
}
