"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { meApi } from "@/lib/api/auth";
import { getTenantContextApi, setTenantContextApi } from "@/lib/api/contexto-unidades";
import { AUTH_SESSION_UPDATED_EVENT } from "@/lib/api/session";
import { hasElevatedAccess, normalizeRoles } from "@/lib/access-control";
import {
  getOptimisticTenantContextSnapshot,
  getTenantContextSnapshotFromStore,
  resolveTenantContextSnapshot,
  syncTenantContextInStore,
  tenantContextNeedsRepair,
  TENANT_CONTEXT_UPDATED_EVENT,
  type TenantContextSnapshot,
} from "@/lib/tenant-context";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

export const DEFAULT_ACTIVE_TENANT_LABEL = "Unidade ativa";
export const DEFAULT_ACADEMIA_LABEL = "Academia";

type TenantContextState = TenantContextSnapshot & {
  loading: boolean;
  error: string | null;
};

type TenantContextValue = TenantContextState & {
  refresh: () => Promise<void>;
  setTenant: (tenantId: string) => Promise<void>;
};

type AuthAccessState = {
  roles: string[];
  canAccessElevatedModules: boolean;
  loading: boolean;
  error: string | null;
};

const EMPTY_TENANT_CONTEXT_SNAPSHOT: TenantContextSnapshot = {
  tenant: null,
  tenantId: "",
  tenantName: DEFAULT_ACTIVE_TENANT_LABEL,
  tenants: [],
  tenantResolved: false,
};

function buildTenantContextState(
  snapshot: TenantContextSnapshot = EMPTY_TENANT_CONTEXT_SNAPSHOT,
  input: Partial<TenantContextState> = {}
): TenantContextState {
  return {
    ...snapshot,
    loading: false,
    error: null,
    ...input,
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
  if (tenantContextNeedsRepair({
    currentTenantId: context.currentTenantId,
    tenantAtual: context.tenantAtual,
    tenants: context.unidadesDisponiveis,
  }) && snapshot.tenantId) {
    const repaired = await setTenantContextApi(
      snapshot.tenantId
    );
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

const TenantContextReact = createContext<TenantContextValue | null>(null);

export function TenantContextProvider({ children }: { children: React.ReactNode }) {
  const requestIdRef = useRef(0);
  const suppressSessionUpdateRef = useRef(0);
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<TenantContextState>(() =>
    buildTenantContextState(EMPTY_TENANT_CONTEXT_SNAPSHOT, {
      loading: true,
    })
  );

  const syncFromStore = useCallback(() => {
    setState((current) => {
      const snapshot = getOptimisticTenantContextSnapshot();
      if (hasSameTenantSnapshot(current, snapshot)) {
        return current;
      }

      return {
        ...current,
        ...snapshot,
        tenantResolved: snapshot.tenantResolved || current.tenantResolved,
      };
    });
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

    setState((current) => ({
      ...current,
      ...getOptimisticTenantContextSnapshot(),
      loading: true,
      error: null,
    }));

    try {
      const snapshot = await runWithoutSessionEcho(() => loadTenantContextSnapshot());
      if (requestIdRef.current !== currentRequestId) return;

      setState({
        ...snapshot,
        loading: false,
        error: null,
      });
    } catch (error) {
      if (requestIdRef.current !== currentRequestId) return;

      const snapshot = getTenantContextSnapshotFromStore();
      setState({
        ...snapshot,
        tenantResolved: Boolean(snapshot.tenant),
        loading: false,
        error: normalizeErrorMessage(error),
      });
    }
  }, [runWithoutSessionEcho]);

  const setTenant = useCallback(async (tenantId: string) => {
    const normalizedTenantId = tenantId.trim();
    if (!normalizedTenantId) return;

    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const snapshot = await runWithoutSessionEcho(async () => {
        const context = await setTenantContextApi(normalizedTenantId);
        return syncTenantContextInStore({
          currentTenantId: context.currentTenantId,
          tenantAtual: context.tenantAtual,
          tenants: context.unidadesDisponiveis,
        });
      });
      setState({
        ...snapshot,
        loading: false,
        error: null,
      });
    } catch (error) {
      const snapshot = getTenantContextSnapshotFromStore();
      setState({
        ...snapshot,
        tenantResolved: Boolean(snapshot.tenant),
        loading: false,
        error: normalizeErrorMessage(error),
      });
      throw error;
    }
  }, [runWithoutSessionEcho]);

  useEffect(() => {
    const kickoffId = window.setTimeout(() => {
      setHydrated(true);
      syncFromStore();
      void refresh();
    }, 0);

    function handleStoreUpdate() {
      syncFromStore();
    }

    function handleSessionUpdate() {
      if (suppressSessionUpdateRef.current > 0) return;
      syncFromStore();
      const snapshot = getOptimisticTenantContextSnapshot();
      if (!snapshot.tenantResolved || snapshot.tenants.length === 0) {
        void refresh();
      }
    }

    window.addEventListener(TENANT_CONTEXT_UPDATED_EVENT, handleStoreUpdate);
    window.addEventListener(AUTH_SESSION_UPDATED_EVENT, handleSessionUpdate);
    window.addEventListener("storage", handleSessionUpdate);
    return () => {
      window.clearTimeout(kickoffId);
      window.removeEventListener(TENANT_CONTEXT_UPDATED_EVENT, handleStoreUpdate);
      window.removeEventListener(AUTH_SESSION_UPDATED_EVENT, handleSessionUpdate);
      window.removeEventListener("storage", handleSessionUpdate);
    };
  }, [refresh, syncFromStore]);

  const exposedState = hydrated
    ? state
    : buildTenantContextState(EMPTY_TENANT_CONTEXT_SNAPSHOT, {
        loading: true,
      });

  return (
    <TenantContextReact.Provider
      value={{
        ...exposedState,
        refresh,
        setTenant,
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
    ...buildTenantContextState(EMPTY_TENANT_CONTEXT_SNAPSHOT),
    refresh: async () => undefined,
    setTenant: async () => undefined,
  };
}

export function useAuthAccess() {
  const requestIdRef = useRef(0);
  const [state, setState] = useState<AuthAccessState>(() => ({
    roles: [],
    canAccessElevatedModules: false,
    loading: true,
    error: null,
  }));

  const refresh = useCallback(async () => {
    const currentRequestId = requestIdRef.current + 1;
    requestIdRef.current = currentRequestId;
    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const user = await meApi();
      if (requestIdRef.current !== currentRequestId) return;
      const roles = normalizeRoles(user?.roles);
      setState({
        roles,
        canAccessElevatedModules: hasElevatedAccess(roles),
        loading: false,
        error: null,
      });
    } catch (error) {
      if (requestIdRef.current !== currentRequestId) return;
      setState({
        roles: [],
        canAccessElevatedModules: false,
        loading: false,
        error: normalizeErrorMessage(error),
      });
    }
  }, []);

  useEffect(() => {
    const kickoffId = window.setTimeout(() => {
      void refresh();
    }, 0);

    function handleStorageUpdate() {
      void refresh();
    }

    function handleSessionUpdate() {
      void refresh();
    }

    window.addEventListener("storage", handleStorageUpdate);
    window.addEventListener(AUTH_SESSION_UPDATED_EVENT, handleSessionUpdate);
    return () => {
      window.clearTimeout(kickoffId);
      window.removeEventListener("storage", handleStorageUpdate);
      window.removeEventListener(AUTH_SESSION_UPDATED_EVENT, handleSessionUpdate);
    };
  }, [refresh]);

  return {
    ...state,
    refresh,
  };
}
