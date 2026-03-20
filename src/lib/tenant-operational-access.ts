import type { TenantAccess } from "@/lib/api/session";
import type { TenantOperationalEligibility, TenantOperationalEligibilityReason } from "@/lib/types";

type TenantOperationalEligibilityReasonApi = {
  code?: string | null;
  message?: string | null;
};

type TenantOperationalEligibilityApi = {
  tenantId?: string | null;
  tenantNome?: string | null;
  defaultTenant?: boolean | null;
  blockedReasons?: TenantOperationalEligibilityReasonApi[] | null;
};

type OperationalAccessApi = {
  blocked?: boolean | null;
  message?: string | null;
  eligibleTenants?: TenantOperationalEligibilityApi[] | null;
  blockedTenants?: TenantOperationalEligibilityApi[] | null;
};

export interface OperationalAccessState {
  blocked: boolean;
  message?: string;
  eligibleTenants: TenantOperationalEligibility[];
  blockedTenants: TenantOperationalEligibility[];
}

function normalizeReason(
  input: TenantOperationalEligibilityReasonApi,
): TenantOperationalEligibilityReason | null {
  const code = input.code?.trim() ?? "";
  const message = input.message?.trim() ?? "";
  if (!code || !message) return null;
  return { code, message };
}

function normalizeTenantEligibility(
  input: TenantOperationalEligibilityApi,
  eligible: boolean,
): TenantOperationalEligibility | null {
  const tenantId = input.tenantId?.trim() ?? "";
  if (!tenantId) return null;
  return {
    tenantId,
    tenantName: input.tenantNome?.trim() || undefined,
    eligible,
    defaultTenant: Boolean(input.defaultTenant),
    blockedReasons: (input.blockedReasons ?? [])
      .map((reason) => normalizeReason(reason))
      .filter((reason): reason is TenantOperationalEligibilityReason => reason !== null),
  };
}

export function normalizeOperationalAccess(
  input?: OperationalAccessApi | null,
): OperationalAccessState | undefined {
  if (!input) return undefined;

  const eligibleTenants = (input.eligibleTenants ?? [])
    .map((tenant) => normalizeTenantEligibility(tenant, true))
    .filter((tenant): tenant is TenantOperationalEligibility => tenant !== null);
  const blockedTenants = (input.blockedTenants ?? [])
    .map((tenant) => normalizeTenantEligibility(tenant, false))
    .filter((tenant): tenant is TenantOperationalEligibility => tenant !== null);

  return {
    blocked: Boolean(input.blocked),
    message: input.message?.trim() || undefined,
    eligibleTenants,
    blockedTenants,
  };
}

export function buildTenantAccessFromEligibility(
  items: TenantOperationalEligibility[],
): TenantAccess[] {
  return items
    .filter((item) => item.eligible)
    .map((item, index) => ({
      tenantId: item.tenantId,
      defaultTenant: Boolean(item.defaultTenant) || index === 0,
    }));
}
