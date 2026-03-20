"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
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
import {
  getActiveTenantIdFromSession,
  getAvailableTenantsFromSession,
  AUTH_SESSION_CLEARED_EVENT,
  AUTH_SESSION_UPDATED_EVENT,
  getAccessToken,
  type AuthSessionScope,
} from "@/lib/api/session";
import { hasClientDeleteCapability, hasElevatedAccess, normalizeRoles } from "@/lib/access-control";
import { Academia, Tenant, TenantBranding } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import {
  getOptimisticTenantContextSnapshot,
  getTenantContextSnapshotFromStore,
  resolveTenantContextSnapshot,
  resetTenantContextMemory,
  syncTenantContextInStore,
  tenantContextNeedsRepair,
  TENANT_CONTEXT_UPDATED_EVENT,
  type TenantContextSnapshot,
} from "@/lib/tenant-context";

export const DEFAULT_ACTIVE_TENANT_LABEL = "Unidade ativa";
export const DEFAULT_ACADEMIA_LABEL = "Academia";
export const DEFAULT_BASE_TENANT_LABEL = "Unidade base";

type BootstrapStatus = "idle" | "loading" | "ready" | "stale" | "error";

type TenantContextState = TenantContextSnapshot & {
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
  networkId?: string;
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

type TenantContextValue = TenantContextState & {
  refresh: () => Promise<void>;
  setTenant: (tenantId: string) => Promise<void>;
  switchActiveTenant: (tenantId: string) => Promise<void>;
  syncAcademiaBranding: (academia: Academia) => void;
};

type SessionBootstrapLoadResult = {
  snapshot: TenantContextSnapshot;
  authUser?: AuthUser;
  roles?: string[];
  canAccessElevatedModules?: boolean;
  canDeleteClient?: boolean;
  academia?: Academia;
  brandingSnapshotOverride?: TenantBranding;
  error: string | null;
};

const EMPTY_TENANT_CONTEXT_SNAPSHOT: TenantContextSnapshot = {
  tenant: null,
  tenantId: "",
  tenantName: DEFAULT_ACTIVE_TENANT_LABEL,
  tenants: [],
  tenantResolved: false,
};

function resolveBrandingSnapshot(
  tenant?: Tenant | null,
  academia?: Academia | null
): TenantBranding | undefined {
  return academia?.branding ?? tenant?.branding;
}

function resolveBaseTenant(
  snapshot: TenantContextSnapshot,
  authUser?: AuthUser | null,
  fallbackBaseTenant?: Tenant | null
): Tenant | null {
  const candidateId =
    authUser?.baseTenantId?.trim()
    || authUser?.availableTenants.find((item) => item.defaultTenant)?.tenantId?.trim()
    || fallbackBaseTenant?.id?.trim()
    || "";

  if (!candidateId) {
    return fallbackBaseTenant ?? null;
  }

  return (
    snapshot.tenants.find((tenant) => tenant.id === candidateId)
    ?? (snapshot.tenant?.id === candidateId ? snapshot.tenant : null)
    ?? fallbackBaseTenant
    ?? null
  );
}

function buildTenantContextState(
  snapshot: TenantContextSnapshot = EMPTY_TENANT_CONTEXT_SNAPSHOT,
  input: Partial<Omit<TenantContextState, keyof TenantContextSnapshot>> = {}
): TenantContextState {
  const roles = input.roles ?? [];
  const currentAcademia = input.academia ?? null;
  const authUser = input.authUser ?? null;
  const baseTenant =
    input.baseTenant
    ?? resolveBaseTenant(snapshot, authUser, input.activeTenant ?? snapshot.tenant ?? null);

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
    baseTenantId: input.baseTenantId ?? baseTenant?.id ?? "",
    baseTenant,
    baseTenantName: input.baseTenantName ?? baseTenant?.nome ?? DEFAULT_BASE_TENANT_LABEL,
    availableTenants: input.availableTenants ?? snapshot.tenants,
    networkId: input.networkId ?? authUser?.networkId,
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

function hasSameTenantSnapshot(current: TenantContextState, next: TenantContextSnapshot): boolean {
  return (
    current.tenantId === next.tenantId
    && current.tenantName === next.tenantName
    && current.tenant?.id === next.tenant?.id
    && current.tenants.length === next.tenants.length
    && current.tenants.every((tenant, index) => tenant.id === next.tenants[index]?.id)
  );
}

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

async function loadSessionBootstrapState(): Promise<SessionBootstrapLoadResult> {
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

function finalizeSessionBrandingSnapshot(
  tenant: Tenant | null,
  academia: Academia | null | undefined,
  override?: TenantBranding,
): TenantBranding | undefined {
  return override ?? resolveBrandingSnapshot(tenant, academia);
}

const TenantContextReact = createContext<TenantContextValue | null>(null);

export function TenantContextProvider({ children }: { children: React.ReactNode }) {
  const requestIdRef = useRef(0);
  const suppressSessionUpdateRef = useRef(0);
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<TenantContextState>(() =>
    buildTenantContextState(EMPTY_TENANT_CONTEXT_SNAPSHOT, {
      loading: true,
      status: "idle",
      error: null,
    })
  );
  const stateRef = useRef(state);
  stateRef.current = state;
  const sessionTokenRef = useRef<string | undefined>(undefined);

  const syncFromStore = useCallback(() => {
    setState((current) => {
      const snapshot = getOptimisticTenantContextSnapshot();
      if (hasSameTenantSnapshot(current, snapshot)) {
        return current;
      }

      return buildTenantContextState(snapshot, {
        ...current,
        ...snapshot,
        tenantResolved: snapshot.tenantResolved || current.tenantResolved,
        activeTenantId: snapshot.tenantId,
        activeTenant: snapshot.tenant,
        availableTenants: snapshot.tenants,
        brandingSnapshot: resolveBrandingSnapshot(snapshot.tenant, current.academia),
        lastTenantSyncAt: Date.now(),
      });
    });
  }, []);

  const clearContextMemory = useCallback(() => {
    resetTenantContextMemory();
    sessionTokenRef.current = undefined;
    setState(buildTenantContextState(EMPTY_TENANT_CONTEXT_SNAPSHOT, {
      loading: false,
      status: "idle",
      error: null,
    }));
  }, []);

  const hasSessionContextState = useCallback(() => {
    return (
      Boolean(getAccessToken())
      || Boolean(getActiveTenantIdFromSession())
      || getAvailableTenantsFromSession().length > 0
    );
  }, []);

  const runWithoutSessionEcho = useCallback(async <T,>(callback: () => Promise<T>): Promise<T> => {
    suppressSessionUpdateRef.current += 1;
    try {
      return await callback();
    } finally {
      window.setTimeout(() => {
        suppressSessionUpdateRef.current = Math.max(0, suppressSessionUpdateRef.current - 1);
      }, 0);
    }
  }, []);

  const refresh = useCallback(async () => {
    const currentRequestId = requestIdRef.current + 1;
    requestIdRef.current = currentRequestId;

    if (!hasSessionContextState()) {
      clearContextMemory();
      return;
    }

    setState((current) => ({
      ...current,
      loading: true,
      status: current.status === "ready" ? "loading" : "stale",
      error: null,
    }));

    try {
      const bootstrapState = await runWithoutSessionEcho(loadSessionBootstrapState);
      if (requestIdRef.current !== currentRequestId) return;

      const now = Date.now();
      setState((current) => {
        const nextAcademia = bootstrapState.academia ?? current.academia;
        const nextRoles = bootstrapState.roles ?? current.roles;
        const nextCanAccess =
          bootstrapState.canAccessElevatedModules ?? hasElevatedAccess(nextRoles);
        return buildTenantContextState(bootstrapState.snapshot, {
          ...current,
          tenantResolved: bootstrapState.snapshot.tenantResolved,
          loading: false,
          status: bootstrapState.error ? "error" : "ready",
          error: bootstrapState.error,
          authUser: bootstrapState.authUser ?? current.authUser,
          roles: nextRoles,
          canAccessElevatedModules: nextCanAccess,
          activeTenantId: bootstrapState.snapshot.tenantId,
          activeTenant: bootstrapState.snapshot.tenant,
          availableTenants: bootstrapState.snapshot.tenants,
          academia: nextAcademia,
          brandingSnapshot: finalizeSessionBrandingSnapshot(
            bootstrapState.snapshot.tenant,
            nextAcademia,
            bootstrapState.brandingSnapshotOverride,
          ),
          lastBootstrapAt: now,
          lastTenantSyncAt: now,
        });
      });
    } catch (error) {
      if (requestIdRef.current !== currentRequestId) return;
      const snapshot = getTenantContextSnapshotFromStore();
      setState((current) => buildTenantContextState(snapshot, {
        ...current,
        activeTenantId: snapshot.tenantId,
        activeTenant: snapshot.tenant,
        availableTenants: snapshot.tenants,
        loading: false,
        status: "error",
        error: normalizeErrorMessage(error),
      }));
    }
  }, [clearContextMemory, hasSessionContextState, runWithoutSessionEcho]);

  const switchActiveTenant = useCallback(async (tenantId: string) => {
    const normalizedTenantId = tenantId.trim();
    if (!normalizedTenantId) return;

    const currentRequestId = requestIdRef.current + 1;
    requestIdRef.current = currentRequestId;

    setState((current) => ({
      ...current,
      loading: true,
      status: "loading",
      error: null,
    }));

    try {
      const bootstrapState = await runWithoutSessionEcho(async () => {
        await setTenantContextApi(normalizedTenantId);
        return loadSessionBootstrapState();
      });
      if (requestIdRef.current !== currentRequestId) return;

      const now = Date.now();
      setState((current) => {
        const nextAcademia = bootstrapState.academia ?? current.academia;
        const nextRoles = bootstrapState.roles ?? current.roles;
        const nextCanAccess =
          bootstrapState.canAccessElevatedModules ?? hasElevatedAccess(nextRoles);
        return buildTenantContextState(bootstrapState.snapshot, {
          ...current,
          tenantResolved: bootstrapState.snapshot.tenantResolved,
          loading: false,
          status: bootstrapState.error ? "error" : "ready",
          error: bootstrapState.error,
          authUser: bootstrapState.authUser ?? current.authUser,
          roles: nextRoles,
          canAccessElevatedModules: nextCanAccess,
          activeTenantId: bootstrapState.snapshot.tenantId,
          activeTenant: bootstrapState.snapshot.tenant,
          availableTenants: bootstrapState.snapshot.tenants,
          academia: nextAcademia,
          brandingSnapshot: finalizeSessionBrandingSnapshot(
            bootstrapState.snapshot.tenant,
            nextAcademia,
            bootstrapState.brandingSnapshotOverride,
          ),
          lastBootstrapAt: now,
          lastTenantSyncAt: now,
        });
      });
    } catch (error) {
      if (requestIdRef.current !== currentRequestId) return;
      setState((current) => ({
        ...current,
        loading: false,
        status: "error",
        error: normalizeErrorMessage(error),
      }));
      throw error;
    }
  }, [runWithoutSessionEcho]);

  const setTenant = useCallback(async (tenantId: string) => {
    await switchActiveTenant(tenantId);
  }, [switchActiveTenant]);

  const syncAcademiaBranding = useCallback((academia: Academia) => {
    setState((current) => ({
      ...current,
      academia,
      brandingSnapshot: finalizeSessionBrandingSnapshot(
        current.tenant,
        academia,
        academia.branding,
      ),
    }));
  }, []);

  useEffect(() => {
    const kickoffId = window.setTimeout(() => {
      const hasSession = hasSessionContextState();
      setHydrated(true);
      syncFromStore();
      sessionTokenRef.current = getAccessToken();

      if (hasSession) {
        void refresh();
      }
    }, 0);

    function handleStoreUpdate() {
      const previousTenantId = stateRef.current.tenantId;
      syncFromStore();
      const currentTenantId = getOptimisticTenantContextSnapshot().tenantId;

      if (currentTenantId && previousTenantId !== currentTenantId) {
        void refresh();
      }
    }

    function handleSessionUpdate() {
      if (suppressSessionUpdateRef.current > 0) return;

      const token = getAccessToken();
      const tokenChanged = sessionTokenRef.current !== token;
      sessionTokenRef.current = token;

      if (!hasSessionContextState()) {
        clearContextMemory();
        return;
      }

      const previousTenantId = stateRef.current.tenantId;
      syncFromStore();
      const currentTenantId = getOptimisticTenantContextSnapshot().tenantId;
      if (
        tokenChanged ||
        !stateRef.current.authUser ||
        (currentTenantId && previousTenantId !== currentTenantId)
      ) {
        void refresh();
      }
    }

    function handleSessionCleared() {
      clearContextMemory();
    }

    window.addEventListener(TENANT_CONTEXT_UPDATED_EVENT, handleStoreUpdate);
    window.addEventListener(AUTH_SESSION_UPDATED_EVENT, handleSessionUpdate);
    window.addEventListener(AUTH_SESSION_CLEARED_EVENT, handleSessionCleared);
    window.addEventListener("storage", handleSessionUpdate);
    return () => {
      window.clearTimeout(kickoffId);
      window.removeEventListener(TENANT_CONTEXT_UPDATED_EVENT, handleStoreUpdate);
      window.removeEventListener(AUTH_SESSION_UPDATED_EVENT, handleSessionUpdate);
      window.removeEventListener(AUTH_SESSION_CLEARED_EVENT, handleSessionCleared);
      window.removeEventListener("storage", handleSessionUpdate);
    };
  }, [
    clearContextMemory,
    hasSessionContextState,
    refresh,
    syncFromStore,
  ]);

  const exposedState = hydrated
    ? state
    : buildTenantContextState(EMPTY_TENANT_CONTEXT_SNAPSHOT, {
        loading: true,
        status: "loading",
        error: null,
      });

  return (
    <TenantContextReact.Provider
      value={{
        ...exposedState,
        refresh,
        setTenant,
        switchActiveTenant,
        syncAcademiaBranding,
      }}
    >
      {children}
    </TenantContextReact.Provider>
  );
}

export function useTenantContext(): TenantContextValue {
  const context = useContext(TenantContextReact);
  if (context) return context;

  return {
    ...buildTenantContextState(EMPTY_TENANT_CONTEXT_SNAPSHOT, {
      loading: true,
      status: "loading",
      error: null,
    }),
    refresh: async () => undefined,
    setTenant: async () => undefined,
    switchActiveTenant: async () => undefined,
    syncAcademiaBranding: () => undefined,
  };
}

export function useAuthAccess() {
  const {
    roles,
    canAccessElevatedModules,
    loading,
    error,
    refresh,
  } = useTenantContext();

  return {
    roles,
    canAccessElevatedModules,
    loading,
    error,
    refresh,
  };
}
