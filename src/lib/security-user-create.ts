import type {
  GlobalAdminNewUnitsPolicyScope,
  GlobalAdminScopeType,
  GlobalAdminUserCreatePayload,
  RbacUserCreatePayload,
  SecurityUserLoginIdentifierInput,
} from "@/lib/types";

function cleanString(value?: string | null): string | undefined {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized ? normalized : undefined;
}

function normalizeIds(values?: string[]): string[] {
  if (!values?.length) return [];
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
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
  const name = cleanString(input.name);
  const email = cleanString(input.email);
  if (!name) {
    throw new Error("Informe o nome do usuário.");
  }
  if (!email) {
    throw new Error("Informe o e-mail principal.");
  }

  const tenantIds = normalizeIds(input.tenantIds);
  const defaultTenantId = cleanString(input.defaultTenantId);

  if (input.scopeType !== "GLOBAL" && !cleanString(input.academiaId)) {
    throw new Error("Selecione a academia de referência para o acesso.");
  }
  if (input.scopeType !== "GLOBAL" && tenantIds.length === 0) {
    throw new Error("Selecione ao menos uma unidade inicial para o acesso.");
  }
  if (defaultTenantId && !tenantIds.includes(defaultTenantId)) {
    throw new Error("A unidade base precisa estar entre as unidades selecionadas.");
  }
  if (input.scopeType === "GLOBAL" && input.eligibleForNewUnits) {
    throw new Error("Propagação para novas unidades só pode ser definida em escopo de rede.");
  }

  return {
    name,
    fullName: name,
    email,
    userKind: cleanString(input.userKind) ?? "COLABORADOR",
    scopeType: input.scopeType,
    academiaId: cleanString(input.academiaId),
    tenantIds: input.scopeType === "GLOBAL" ? [] : tenantIds,
    defaultTenantId: defaultTenantId ?? tenantIds[0],
    broadAccess: Boolean(input.broadAccess),
    eligibleForNewUnits: input.scopeType === "REDE" ? Boolean(input.eligibleForNewUnits) : false,
    policyScope:
      input.scopeType === "REDE" && input.eligibleForNewUnits
        ? input.policyScope ?? "ACADEMIA_ATUAL"
        : undefined,
    loginIdentifiers: buildSecurityLoginIdentifiers({
      email,
      cpf: input.cpf,
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
  const name = cleanString(input.name);
  const email = cleanString(input.email);
  if (!name) {
    throw new Error("Informe o nome do usuário.");
  }
  if (!email) {
    throw new Error("Informe o e-mail principal.");
  }

  const networkId = cleanString(input.networkId);
  if (!networkId) {
    throw new Error("A rede atual precisa estar identificada para criar o usuário.");
  }

  const tenantIds = normalizeIds(input.tenantIds);
  const allowedTenantIds = normalizeIds(input.allowedTenantIds);
  if (tenantIds.length === 0) {
    throw new Error("Selecione ao menos uma unidade da rede atual.");
  }
  if (allowedTenantIds.length > 0 && tenantIds.some((tenantId) => !allowedTenantIds.includes(tenantId))) {
    throw new Error("A academia só pode criar usuários dentro das unidades da própria rede.");
  }

  const defaultTenantId = cleanString(input.defaultTenantId);
  if (defaultTenantId && !tenantIds.includes(defaultTenantId)) {
    throw new Error("A unidade base precisa estar entre as unidades selecionadas.");
  }

  const initialPerfilIds = normalizeIds(input.initialPerfilIds);
  const allowedPerfilIds = normalizeIds(input.allowedPerfilIds);
  if (allowedPerfilIds.length > 0 && initialPerfilIds.some((perfilId) => !allowedPerfilIds.includes(perfilId))) {
    throw new Error("Selecione apenas perfis disponíveis para a academia atual.");
  }

  return {
    name,
    fullName: name,
    email,
    userKind: cleanString(input.userKind) ?? "COLABORADOR",
    networkId,
    networkName: cleanString(input.networkName),
    networkSubdomain: cleanString(input.networkSubdomain),
    tenantIds,
    defaultTenantId: defaultTenantId ?? tenantIds[0],
    initialPerfilIds,
    loginIdentifiers: buildSecurityLoginIdentifiers({
      email,
      cpf: input.cpf,
    }),
  };
}
