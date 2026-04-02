"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { hasElevatedAccess } from "@/lib/access-control";
import type { Academia } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { setTenantContextApi } from "@/lib/api/contexto-unidades";
import {
  getActiveTenantIdFromSession,
  getAvailableTenantsFromSession,
  getAuthSessionSnapshot,
  getRolesFromSession,
  AUTH_SESSION_CLEARED_EVENT,
  AUTH_SESSION_UPDATED_EVENT,
  hasActiveSession,
} from "@/lib/api/session";
import {
  getOptimisticTenantContextSnapshot,
  getTenantContextSnapshotFromStore,
  resetTenantContextMemory,
  syncTenantContextInStore,
  TENANT_CONTEXT_UPDATED_EVENT,
} from "@/lib/tenant/tenant-context";

import {
  buildTenantContextState,
  EMPTY_TENANT_CONTEXT_SNAPSHOT,
  finalizeSessionBrandingSnapshot,
  hasSameTenantSnapshot,
  resolveBrandingSnapshot,
  type TenantContextState,
  type TenantContextValue,
} from "./tenant-state-builder";
import { loadSessionBootstrapState } from "./session-bootstrap";

// Re-export public API so consumers don't need to change imports
export {
  DEFAULT_ACTIVE_TENANT_LABEL,
  DEFAULT_ACADEMIA_LABEL,
  DEFAULT_BASE_TENANT_LABEL,
  type TenantContextState,
  type TenantContextValue,
  type BootstrapStatus,
} from "./tenant-state-builder";
export type { TenantContextSnapshot } from "@/lib/tenant/tenant-context";

const TenantContextReact = createContext<TenantContextValue | null>(null);

function buildUnprovidedTenantContextValue(): TenantContextValue {
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

function resolveUnprovidedTenantContextValue(): TenantContextValue {
  const snapshot = getOptimisticTenantContextSnapshot();
  const session = getAuthSessionSnapshot();
  const roles = getRolesFromSession();

  return {
    ...buildTenantContextState(snapshot, {
      loading: false,
      status: "idle",
      error: null,
      roles,
      canAccessElevatedModules: hasElevatedAccess(roles),
      activeTenantId: snapshot.tenantId,
      activeTenant: snapshot.tenant,
      baseTenantId: session?.baseTenantId ?? snapshot.tenantId,
      userId: session?.userId,
      displayName: session?.displayName,
      userKind: session?.userKind,
      networkId: session?.networkId,
      networkSlug: session?.networkSlug ?? session?.networkSubdomain,
      networkSubdomain: session?.networkSubdomain ?? session?.networkSlug,
      networkName: session?.networkName,
      availableScopes: session?.availableScopes ?? [],
      broadAccess: session?.broadAccess ?? false,
    }),
    refresh: async () => undefined,
    setTenant: async () => undefined,
    switchActiveTenant: async () => undefined,
    syncAcademiaBranding: () => undefined,
  };
}

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

      return buildTenantContextState({ ...snapshot, tenantResolved: snapshot.tenantResolved || current.tenantResolved }, {
        authUser: current.authUser,
        roles: current.roles,
        canAccessElevatedModules: current.canAccessElevatedModules,
        canDeleteClient: current.canDeleteClient,
        baseTenantId: current.baseTenantId,
        baseTenant: current.baseTenant,
        baseTenantName: current.baseTenantName,
        networkId: current.networkId,
        networkSlug: current.networkSlug,
        networkName: current.networkName,
        userId: current.userId,
        displayName: current.displayName,
        userKind: current.userKind,
        availableScopes: current.availableScopes,
        broadAccess: current.broadAccess,
        academia: current.academia,
        lastBootstrapAt: current.lastBootstrapAt,
        activeTenantId: snapshot.tenantId,
        activeTenant: snapshot.tenant,
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
      hasActiveSession()
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
          loading: false,
          status: bootstrapState.error ? "error" : "ready",
          error: bootstrapState.error,
          authUser: bootstrapState.authUser ?? current.authUser,
          roles: nextRoles,
          canAccessElevatedModules: nextCanAccess,
          activeTenantId: bootstrapState.snapshot.tenantId,
          activeTenant: bootstrapState.snapshot.tenant,
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
        authUser: current.authUser,
        roles: current.roles,
        canAccessElevatedModules: current.canAccessElevatedModules,
        canDeleteClient: current.canDeleteClient,
        baseTenantId: current.baseTenantId,
        baseTenant: current.baseTenant,
        baseTenantName: current.baseTenantName,
        networkId: current.networkId,
        networkSlug: current.networkSlug,
        networkName: current.networkName,
        userId: current.userId,
        displayName: current.displayName,
        userKind: current.userKind,
        availableScopes: current.availableScopes,
        broadAccess: current.broadAccess,
        academia: current.academia,
        brandingSnapshot: current.brandingSnapshot,
        lastBootstrapAt: current.lastBootstrapAt,
        lastTenantSyncAt: current.lastTenantSyncAt,
        activeTenantId: snapshot.tenantId,
        activeTenant: snapshot.tenant,
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
        const switchedContext = await setTenantContextApi(normalizedTenantId);
        const nextBootstrapState = await loadSessionBootstrapState();
        if (nextBootstrapState.snapshot.tenantId === normalizedTenantId) {
          return nextBootstrapState;
        }

        const switchedTenant =
          switchedContext.unidadesDisponiveis.find((tenant) => tenant.id === normalizedTenantId)
          ?? (switchedContext.tenantAtual?.id === normalizedTenantId ? switchedContext.tenantAtual : null);

        if (!switchedTenant) {
          return nextBootstrapState;
        }

        const correctedSnapshot = syncTenantContextInStore({
          currentTenantId: normalizedTenantId,
          tenantAtual: switchedTenant,
          tenants: switchedContext.unidadesDisponiveis,
        });

        return {
          ...nextBootstrapState,
          snapshot: correctedSnapshot,
        };
      });
      if (requestIdRef.current !== currentRequestId) return;

      const now = Date.now();
      setState((current) => {
        const nextAcademia = bootstrapState.academia ?? current.academia;
        const nextRoles = bootstrapState.roles ?? current.roles;
        const nextCanAccess =
          bootstrapState.canAccessElevatedModules ?? hasElevatedAccess(nextRoles);
        return buildTenantContextState(bootstrapState.snapshot, {
          loading: false,
          status: bootstrapState.error ? "error" : "ready",
          error: bootstrapState.error,
          authUser: bootstrapState.authUser ?? current.authUser,
          roles: nextRoles,
          canAccessElevatedModules: nextCanAccess,
          activeTenantId: bootstrapState.snapshot.tenantId,
          activeTenant: bootstrapState.snapshot.tenant,
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
      sessionTokenRef.current = hasActiveSession() ? "active" : undefined;

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

      const token = hasActiveSession() ? "active" : undefined;
      const tokenChanged = sessionTokenRef.current !== token;
      sessionTokenRef.current = token;

      if (tokenChanged && hasSessionContextState()) {
        resetTenantContextMemory();
        setState(buildTenantContextState(EMPTY_TENANT_CONTEXT_SNAPSHOT, {
          loading: true,
          status: "loading",
          error: null,
        }));
      }

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
  const [fallbackContext, setFallbackContext] = useState<TenantContextValue>(() =>
    buildUnprovidedTenantContextValue()
  );

  useEffect(() => {
    if (context) return;

    function syncFallbackContext() {
      setFallbackContext(resolveUnprovidedTenantContextValue());
    }

    syncFallbackContext();
    window.addEventListener(AUTH_SESSION_UPDATED_EVENT, syncFallbackContext);
    window.addEventListener(AUTH_SESSION_CLEARED_EVENT, syncFallbackContext);
    window.addEventListener(TENANT_CONTEXT_UPDATED_EVENT, syncFallbackContext);
    window.addEventListener("storage", syncFallbackContext);
    return () => {
      window.removeEventListener(AUTH_SESSION_UPDATED_EVENT, syncFallbackContext);
      window.removeEventListener(AUTH_SESSION_CLEARED_EVENT, syncFallbackContext);
      window.removeEventListener(TENANT_CONTEXT_UPDATED_EVENT, syncFallbackContext);
      window.removeEventListener("storage", syncFallbackContext);
    };
  }, [context]);

  if (context) return context;

  return fallbackContext;
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
