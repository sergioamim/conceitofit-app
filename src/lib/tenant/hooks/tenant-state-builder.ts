import { hasClientDeleteCapability, hasElevatedAccess } from "@/lib/access-control";
import { getOperationalScopeDefaultTenantId } from "@/lib/api/session";
import { isClientOperationalEligibilityEnabled } from "@/lib/feature-flags";
import type { Academia, Tenant, TenantBranding, TenantOperationalEligibility } from "@/lib/types";
import type { AuthUser } from "@/lib/api/auth";
import type { AuthSessionScope } from "@/lib/api/session";
import type { TenantContextSnapshot } from "@/lib/tenant/tenant-context";

export const DEFAULT_ACTIVE_TENANT_LABEL = "Unidade ativa";
export const DEFAULT_ACADEMIA_LABEL = "Academia";
export const DEFAULT_BASE_TENANT_LABEL = "Unidade base";

export type BootstrapStatus = "idle" | "loading" | "ready" | "stale" | "error";

export type TenantContextState = TenantContextSnapshot & {
  loading: boolean;
  status: BootstrapStatus;
  error: string | null;
  authUser: AuthUser | null;
  roles: string[];
  canAccessElevatedModules: boolean;
  canDeleteClient: boolean;
  activeTenantId: string;
  activeTenant: Tenant | null;
  baseTenantId: string;
  baseTenant: Tenant | null;
  baseTenantName: string;
  availableTenants: Tenant[];
  eligibleTenants: Tenant[];
  blockedTenants: TenantOperationalEligibility[];
  operationalAccessBlocked: boolean;
  operationalAccessMessage: string | null;
  canSwitchEligibleTenant: boolean;
  networkId?: string;
  networkSubdomain?: string;
  networkSlug?: string;
  networkName?: string;
  userId?: string;
  displayName?: string;
  userKind?: string;
  availableScopes: AuthSessionScope[];
  broadAccess: boolean;
  academia: Academia | null;
  brandingSnapshot: TenantBranding | undefined;
  lastBootstrapAt?: number;
  lastTenantSyncAt?: number;
};

export type TenantContextValue = TenantContextState & {
  refresh: () => Promise<void>;
  setTenant: (tenantId: string) => Promise<void>;
  switchActiveTenant: (tenantId: string) => Promise<void>;
  syncAcademiaBranding: (academia: Academia) => void;
};

export const EMPTY_TENANT_CONTEXT_SNAPSHOT: TenantContextSnapshot = {
  tenant: null,
  tenantId: "",
  tenantName: DEFAULT_ACTIVE_TENANT_LABEL,
  tenants: [],
  tenantResolved: false,
};

export function resolveBrandingSnapshot(
  tenant?: Tenant | null,
  academia?: Academia | null
): TenantBranding | undefined {
  return academia?.branding ?? tenant?.branding;
}

export function resolveBaseTenant(
  snapshot: TenantContextSnapshot,
  authUser?: AuthUser | null,
  fallbackBaseTenant?: Tenant | null
): Tenant | null {
  const scopedBaseTenantId = getOperationalScopeDefaultTenantId();
  const candidateId =
    scopedBaseTenantId?.trim()
    || authUser?.baseTenantId?.trim()
    || authUser?.availableTenants.find((item) => item.defaultTenant)?.tenantId?.trim()
    || fallbackBaseTenant?.id?.trim()
    || "";

  if (!candidateId) {
    return fallbackBaseTenant ?? null;
  }

  const operationalBaseTenant = [
    ...(authUser?.operationalAccess?.eligibleTenants ?? []),
    ...(authUser?.operationalAccess?.blockedTenants ?? []),
  ].find((tenant) => tenant.tenantId === candidateId);

  return (
    snapshot.tenants.find((tenant) => tenant.id === candidateId)
    ?? (snapshot.tenant?.id === candidateId ? snapshot.tenant : null)
    ?? (
      operationalBaseTenant
        ? {
            id: operationalBaseTenant.tenantId,
            nome: operationalBaseTenant.tenantName ?? DEFAULT_BASE_TENANT_LABEL,
            ativo: operationalBaseTenant.eligible,
          }
        : null
    )
    ?? fallbackBaseTenant
    ?? null
  );
}

export function resolveEligibleTenants(
  snapshot: TenantContextSnapshot,
  authUser?: AuthUser | null,
): Tenant[] {
  if (!isClientOperationalEligibilityEnabled()) {
    return snapshot.tenants;
  }

  if (authUser?.operationalAccess) {
    const eligibleIds = authUser.operationalAccess.eligibleTenants
      .map((item) => item.tenantId.trim())
      .filter(Boolean);
    if (eligibleIds.length === 0) {
      return [];
    }

    const byId = new Map(snapshot.tenants.map((tenant) => [tenant.id, tenant] as const));
    return eligibleIds
      .map((tenantId) => byId.get(tenantId))
      .filter((tenant): tenant is Tenant => tenant != null);
  }
  return snapshot.tenants;
}

export function resolveBlockedTenants(authUser?: AuthUser | null): TenantOperationalEligibility[] {
  if (!isClientOperationalEligibilityEnabled()) {
    return [];
  }
  return authUser?.operationalAccess?.blockedTenants ?? [];
}

export function buildTenantContextState(
  snapshot: TenantContextSnapshot = EMPTY_TENANT_CONTEXT_SNAPSHOT,
  input: Partial<Omit<TenantContextState, keyof TenantContextSnapshot>> = {}
): TenantContextState {
  const roles = input.roles ?? [];
  const currentAcademia = input.academia ?? null;
  const authUser = input.authUser ?? null;
  const scopedBaseTenantId = getOperationalScopeDefaultTenantId();
  const baseTenant =
    input.baseTenant
    ?? resolveBaseTenant(snapshot, authUser, input.activeTenant ?? snapshot.tenant ?? null);
  const eligibleTenants = input.eligibleTenants ?? resolveEligibleTenants(snapshot, authUser);
  const blockedTenants = input.blockedTenants ?? resolveBlockedTenants(authUser);
  const operationalAccessBlocked =
    input.operationalAccessBlocked
    ?? (isClientOperationalEligibilityEnabled()
      ? (
          authUser?.operationalAccess?.blocked
          ?? (eligibleTenants.length === 0 && blockedTenants.length > 0)
        )
      : false);
  const operationalAccessMessage =
    input.operationalAccessMessage
    ?? (
      isClientOperationalEligibilityEnabled()
        ? authUser?.operationalAccess?.message ?? null
        : null
    );

  return {
    ...snapshot,
    loading: input.loading ?? false,
    status: input.status ?? "idle",
    error: input.error ?? null,
    authUser,
    roles,
    canAccessElevatedModules:
      input.canAccessElevatedModules ?? hasElevatedAccess(roles),
    canDeleteClient: input.canDeleteClient ?? hasClientDeleteCapability(roles),
    activeTenantId: input.activeTenantId ?? snapshot.tenantId,
    activeTenant: input.activeTenant ?? snapshot.tenant ?? null,
    baseTenantId: scopedBaseTenantId ?? input.baseTenantId ?? baseTenant?.id ?? "",
    baseTenant,
    baseTenantName: input.baseTenantName ?? baseTenant?.nome ?? DEFAULT_BASE_TENANT_LABEL,
    availableTenants: input.availableTenants ?? eligibleTenants,
    eligibleTenants,
    blockedTenants,
    operationalAccessBlocked,
    operationalAccessMessage,
    canSwitchEligibleTenant: eligibleTenants.length > 1,
    networkId: input.networkId ?? authUser?.networkId,
    networkSubdomain: input.networkSubdomain ?? authUser?.networkSubdomain ?? authUser?.networkSlug,
    networkSlug: input.networkSlug ?? authUser?.networkSlug,
    networkName: input.networkName ?? authUser?.networkName,
    userId: input.userId ?? authUser?.userId ?? authUser?.id,
    displayName: input.displayName ?? authUser?.displayName ?? authUser?.nome,
    userKind: input.userKind ?? authUser?.userKind,
    availableScopes: input.availableScopes ?? authUser?.availableScopes ?? [],
    broadAccess: input.broadAccess ?? authUser?.broadAccess ?? false,
    academia: currentAcademia,
    brandingSnapshot: input.brandingSnapshot ?? resolveBrandingSnapshot(snapshot.tenant, currentAcademia),
    lastBootstrapAt: input.lastBootstrapAt,
    lastTenantSyncAt: input.lastTenantSyncAt,
  };
}

export function hasSameTenantSnapshot(current: TenantContextState, next: TenantContextSnapshot): boolean {
  return (
    current.tenantId === next.tenantId
    && current.tenantName === next.tenantName
    && current.tenant?.id === next.tenant?.id
    && current.tenants.length === next.tenants.length
    && current.tenants.every((tenant, index) => tenant.id === next.tenants[index]?.id)
  );
}

export function finalizeSessionBrandingSnapshot(
  tenant: Tenant | null,
  academia: Academia | null | undefined,
  override?: TenantBranding,
): TenantBranding | undefined {
  return override ?? resolveBrandingSnapshot(tenant, academia);
}
