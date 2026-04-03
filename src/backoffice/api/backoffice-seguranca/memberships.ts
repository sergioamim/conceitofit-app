import type {
  GlobalAdminNewUnitsPolicyScope,
  GlobalAdminUserDetail,
} from "@/lib/types";
import { apiRequest } from "@/lib/api/http";
import type { RawUserDetail } from "./_shared";
import {
  cleanString,
  getGlobalAdminUserDetailFromRaw,
  hasUserDetailPayload,
} from "./_shared";
import { getGlobalAdminUserDetailApi } from "./users";

async function resolveUserDetailAfterMutation(
  userId: string,
  response?: RawUserDetail | null
): Promise<GlobalAdminUserDetail> {
  if (hasUserDetailPayload(response)) {
    return getGlobalAdminUserDetailFromRaw(response);
  }
  return getGlobalAdminUserDetailApi(userId);
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
