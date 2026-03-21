import type {
  GlobalAdminNewUnitsPolicyScope,
  GlobalAdminScopeType,
  GlobalAdminUserCreatePayload,
  RbacUserCreatePayload,
  SecurityUserLoginIdentifierInput,
} from "@/lib/types";
import {
  academiaUserCreateFormSchema,
  globalUserCreateFormSchema,
} from "@/lib/forms/security-user-create-schemas";

function cleanString(value?: string | null): string | undefined {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized ? normalized : undefined;
}

function normalizeIds(values?: string[]): string[] {
  if (!values?.length) return [];
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

function ensureParsed<T>(result: { success: boolean; data?: T; error?: { issues: Array<{ message: string }> } }): T {
  if (result.success && result.data) {
    return result.data;
  }
  throw new Error(result.error?.issues[0]?.message ?? "Dados inválidos para criar usuário.");
}

export function buildSecurityLoginIdentifiers(input: {
  email: string;
  cpf?: string;
}): SecurityUserLoginIdentifierInput[] {
  const items: SecurityUserLoginIdentifierInput[] = [];
  const email = cleanString(input.email);
  const cpf = cleanString(input.cpf);

  if (email) {
    items.push({ label: "E-mail", value: email });
  }
  if (cpf) {
    items.push({ label: "CPF", value: cpf });
  }

  return items;
}

export function validateGlobalUserCreateDraft(input: {
  name: string;
  email: string;
  cpf?: string;
  userKind?: string;
  scopeType: GlobalAdminScopeType;
  academiaId?: string;
  tenantIds?: string[];
  defaultTenantId?: string;
  broadAccess?: boolean;
  eligibleForNewUnits?: boolean;
  policyScope?: GlobalAdminNewUnitsPolicyScope;
}): GlobalAdminUserCreatePayload {
  const parsed = ensureParsed(globalUserCreateFormSchema.safeParse({
    name: input.name,
    email: input.email,
    cpf: input.cpf ?? "",
    userKind: input.userKind ?? "COLABORADOR",
    scopeType: input.scopeType,
    academiaId: input.academiaId ?? "",
    tenantIds: normalizeIds(input.tenantIds),
    defaultTenantId: cleanString(input.defaultTenantId) ?? "",
    broadAccess: Boolean(input.broadAccess),
    eligibleForNewUnits: Boolean(input.eligibleForNewUnits),
    policyScope: input.policyScope ?? "ACADEMIA_ATUAL",
  }));

  const name = cleanString(parsed.name)!;
  const email = cleanString(parsed.email)!;
  const tenantIds = normalizeIds(parsed.tenantIds);
  const defaultTenantId = cleanString(parsed.defaultTenantId);

  return {
    name,
    fullName: name,
    email,
    userKind: cleanString(parsed.userKind) ?? "COLABORADOR",
    scopeType: parsed.scopeType,
    academiaId: cleanString(parsed.academiaId),
    tenantIds: parsed.scopeType === "GLOBAL" ? [] : tenantIds,
    defaultTenantId: defaultTenantId ?? tenantIds[0],
    broadAccess: parsed.broadAccess,
    eligibleForNewUnits: parsed.scopeType === "REDE" ? parsed.eligibleForNewUnits : false,
    policyScope:
      parsed.scopeType === "REDE" && parsed.eligibleForNewUnits
        ? parsed.policyScope ?? "ACADEMIA_ATUAL"
        : undefined,
    loginIdentifiers: buildSecurityLoginIdentifiers({
      email,
      cpf: parsed.cpf,
    }),
  };
}

export function validateAcademiaUserCreateDraft(input: {
  name: string;
  email: string;
  cpf?: string;
  userKind?: string;
  networkId?: string;
  networkName?: string;
  networkSubdomain?: string;
  tenantIds?: string[];
  defaultTenantId?: string;
  initialPerfilIds?: string[];
  allowedTenantIds?: string[];
  allowedPerfilIds?: string[];
}): RbacUserCreatePayload {
  const parsed = ensureParsed(academiaUserCreateFormSchema.safeParse({
    name: input.name,
    email: input.email,
    cpf: input.cpf ?? "",
    userKind: input.userKind ?? "COLABORADOR",
    networkId: input.networkId ?? "",
    networkName: input.networkName ?? "",
    networkSubdomain: input.networkSubdomain ?? "",
    tenantIds: normalizeIds(input.tenantIds),
    defaultTenantId: cleanString(input.defaultTenantId) ?? "",
    initialPerfilIds: normalizeIds(input.initialPerfilIds),
    allowedTenantIds: normalizeIds(input.allowedTenantIds),
    allowedPerfilIds: normalizeIds(input.allowedPerfilIds),
  }));

  const name = cleanString(parsed.name)!;
  const email = cleanString(parsed.email)!;
  const networkId = cleanString(parsed.networkId)!;
  const tenantIds = normalizeIds(parsed.tenantIds);
  const defaultTenantId = cleanString(parsed.defaultTenantId);
  const initialPerfilIds = normalizeIds(parsed.initialPerfilIds);

  return {
    name,
    fullName: name,
    email,
    userKind: cleanString(parsed.userKind) ?? "COLABORADOR",
    networkId,
    networkName: cleanString(parsed.networkName),
    networkSubdomain: cleanString(parsed.networkSubdomain),
    tenantIds,
    defaultTenantId: defaultTenantId ?? tenantIds[0],
    initialPerfilIds,
    loginIdentifiers: buildSecurityLoginIdentifiers({
      email,
      cpf: parsed.cpf,
    }),
  };
}
