import { meApi, type AuthUser } from "@/lib/api/auth";
import {
  getAcademiaAtualApi,
  getSessionBootstrapApi,
  getTenantContextApi,
  isSessionBootstrapEndpointEnabled,
  isSessionBootstrapFallbackEnabled,
  isSessionBootstrapMissingRouteError,
  setTenantContextApi,
} from "@/lib/api/contexto-unidades";
import { hasClientDeleteCapability, hasElevatedAccess, normalizeRoles } from "@/lib/access-control";
import type { Academia, TenantBranding } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import {
  resolveTenantContextSnapshot,
  syncTenantContextInStore,
  tenantContextNeedsRepair,
  type TenantContextSnapshot,
} from "@/lib/tenant/tenant-context";

export type SessionBootstrapLoadResult = {
  snapshot: TenantContextSnapshot;
  authUser?: AuthUser;
  roles?: string[];
  canAccessElevatedModules?: boolean;
  canDeleteClient?: boolean;
  academia?: Academia;
  brandingSnapshotOverride?: TenantBranding;
  error: string | null;
};

async function loadTenantContextSnapshot(): Promise<TenantContextSnapshot> {
  const context = await getTenantContextApi();
  const snapshot = resolveTenantContextSnapshot({
    currentTenantId: context.currentTenantId,
    tenantAtual: context.tenantAtual,
    tenants: context.unidadesDisponiveis,
  });
  if (
    tenantContextNeedsRepair({
      currentTenantId: context.currentTenantId,
      tenantAtual: context.tenantAtual,
      tenants: context.unidadesDisponiveis,
    })
    && snapshot.tenantId
  ) {
    const repaired = await setTenantContextApi(snapshot.tenantId);
    return syncTenantContextInStore({
      currentTenantId: repaired.currentTenantId,
      tenantAtual: repaired.tenantAtual,
      tenants: repaired.unidadesDisponiveis,
    });
  }

  return syncTenantContextInStore({
    currentTenantId: context.currentTenantId,
    tenantAtual: context.tenantAtual,
    tenants: context.unidadesDisponiveis,
  });
}

async function loadAuthAndAcademiaState(): Promise<{
  authUser?: AuthUser;
  roles?: string[];
  canAccessElevatedModules?: boolean;
  canDeleteClient?: boolean;
  academia?: Academia;
  error: string | null;
}> {
  const [meResult, academiaResult] = await Promise.allSettled([
    meApi(),
    getAcademiaAtualApi(),
  ]);

  let authUser: AuthUser | undefined;
  let roles: string[] | undefined;
  let canAccessElevatedModules: boolean | undefined;
  let canDeleteClient: boolean | undefined;
  let academia: Academia | undefined;
  let error: string | null = null;

  if (meResult.status === "fulfilled") {
    roles = normalizeRoles(meResult.value.roles);
    canAccessElevatedModules = hasElevatedAccess(roles);
    canDeleteClient = hasClientDeleteCapability(roles);
    authUser = meResult.value;
  } else {
    error = normalizeErrorMessage(meResult.reason);
  }

  if (academiaResult.status === "fulfilled") {
    academia = academiaResult.value;
  } else if (!error) {
    error = normalizeErrorMessage(academiaResult.reason);
  }

  return {
    authUser,
    roles,
    canAccessElevatedModules,
    canDeleteClient,
    academia,
    error,
  };
}

async function loadSessionBootstrapFromLegacy(): Promise<SessionBootstrapLoadResult> {
  const context = await loadTenantContextSnapshot();
  const derived = await loadAuthAndAcademiaState();
  return {
    snapshot: context,
    authUser: derived.authUser,
    roles: derived.roles,
    canAccessElevatedModules: derived.canAccessElevatedModules,
    canDeleteClient: derived.canDeleteClient,
    academia: derived.academia,
    brandingSnapshotOverride: undefined,
    error: derived.error,
  };
}

export async function loadSessionBootstrapState(): Promise<SessionBootstrapLoadResult> {
  if (!isSessionBootstrapEndpointEnabled()) {
    return loadSessionBootstrapFromLegacy();
  }

  try {
    const bootstrap = await getSessionBootstrapApi();
    const roles = normalizeRoles(bootstrap.user.roles);
    return {
      snapshot: syncTenantContextInStore({
        currentTenantId: bootstrap.tenantContext.currentTenantId,
        tenantAtual: bootstrap.tenantContext.tenantAtual,
        tenants: bootstrap.tenantContext.unidadesDisponiveis,
      }),
      authUser: bootstrap.user,
      roles,
      canAccessElevatedModules:
        bootstrap.capabilities?.canAccessElevatedModules ?? hasElevatedAccess(roles),
      canDeleteClient:
        bootstrap.capabilities?.canDeleteClient ?? hasClientDeleteCapability(roles),
      academia: bootstrap.academia,
      brandingSnapshotOverride: bootstrap.branding,
      error: null,
    };
  } catch (error) {
    if (isSessionBootstrapFallbackEnabled() && isSessionBootstrapMissingRouteError(error)) {
      return loadSessionBootstrapFromLegacy();
    }

    throw error;
  }
}
