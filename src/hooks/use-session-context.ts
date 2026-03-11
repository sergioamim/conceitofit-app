"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { authMe, getCurrentTenant, listTenants } from "@/lib/mock/services";
import { getStore } from "@/lib/mock/store";
import { isRealApiEnabled } from "@/lib/api/http";
import { AUTH_SESSION_UPDATED_EVENT } from "@/lib/api/session";
import { hasElevatedAccess, normalizeRoles } from "@/lib/access-control";
import type { Tenant } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

type TenantContextState = {
  tenant: Tenant | null;
  tenantId: string;
  tenantName: string;
  tenants: Tenant[];
  tenantResolved: boolean;
  loading: boolean;
  error: string | null;
};

type AuthAccessState = {
  roles: string[];
  canAccessElevatedModules: boolean;
  loading: boolean;
  error: string | null;
};

function dedupeTenants(items: Tenant[]): Tenant[] {
  return Array.from(new Map(items.map((tenant) => [tenant.id, tenant] as const)).values());
}

function filterVisibleTenants(items: Tenant[]): Tenant[] {
  const deduped = dedupeTenants(items);
  const activeOnly = deduped.filter((tenant) => tenant.ativo !== false);
  return activeOnly.length > 0 ? activeOnly : deduped;
}

function getTenantSnapshot(): Omit<TenantContextState, "loading" | "error"> {
  const store = getStore();
  const tenants = filterVisibleTenants(store.tenants ?? []);
  const tenantId = store.currentTenantId || store.tenant?.id || tenants[0]?.id || "";
  const tenant =
    (tenantId ? tenants.find((item) => item.id === tenantId) : null) ??
    (tenantId ? store.tenants.find((item) => item.id === tenantId) ?? null : null) ??
    store.tenant ??
    tenants[0] ??
    null;

  return {
    tenant,
    tenantId: tenant?.id ?? "",
    tenantName: tenant?.nome ?? "Tenant ativo",
    tenants,
    tenantResolved: Boolean(tenant),
  };
}

function buildTenantContextState(
  input: Partial<TenantContextState> = {}
): TenantContextState {
  const snapshot = getTenantSnapshot();
  return {
    ...snapshot,
    loading: false,
    error: null,
    ...input,
  };
}

export function useTenantContext() {
  const requestIdRef = useRef(0);
  const [state, setState] = useState<TenantContextState>(() => buildTenantContextState());

  const syncFromStore = useCallback(() => {
    setState((current) => {
      const snapshot = getTenantSnapshot();
      if (
        current.tenantId === snapshot.tenantId &&
        current.tenantName === snapshot.tenantName &&
        current.tenants.length === snapshot.tenants.length &&
        current.tenants.every((tenant, index) => tenant.id === snapshot.tenants[index]?.id)
      ) {
        return current;
      }

      return {
        ...current,
        ...snapshot,
        tenantResolved: snapshot.tenantResolved || current.tenantResolved,
      };
    });
  }, []);

  const refresh = useCallback(async () => {
    const currentRequestId = requestIdRef.current + 1;
    requestIdRef.current = currentRequestId;

    setState((current) => ({
      ...current,
      ...getTenantSnapshot(),
      loading: true,
      error: null,
    }));

    try {
      const [currentTenant, availableTenants] = await Promise.all([
        getCurrentTenant(),
        listTenants(),
      ]);

      if (requestIdRef.current !== currentRequestId) return;

      const tenants = filterVisibleTenants(availableTenants);
      const tenant =
        tenants.find((item) => item.id === currentTenant.id) ??
        currentTenant ??
        tenants[0] ??
        null;

      setState({
        tenant,
        tenantId: tenant?.id ?? "",
        tenantName: tenant?.nome ?? "Tenant ativo",
        tenants,
        tenantResolved: Boolean(tenant),
        loading: false,
        error: null,
      });
    } catch (error) {
      if (requestIdRef.current !== currentRequestId) return;

      const snapshot = getTenantSnapshot();
      setState({
        ...snapshot,
        tenantResolved: true,
        loading: false,
        error: normalizeErrorMessage(error),
      });
    }
  }, []);

  useEffect(() => {
    syncFromStore();
    void refresh();

    function handleStoreUpdate() {
      syncFromStore();
    }

    function handleSessionUpdate() {
      syncFromStore();
      void refresh();
    }

    window.addEventListener("academia-store-updated", handleStoreUpdate);
    window.addEventListener(AUTH_SESSION_UPDATED_EVENT, handleSessionUpdate);
    window.addEventListener("storage", handleSessionUpdate);
    return () => {
      window.removeEventListener("academia-store-updated", handleStoreUpdate);
      window.removeEventListener(AUTH_SESSION_UPDATED_EVENT, handleSessionUpdate);
      window.removeEventListener("storage", handleSessionUpdate);
    };
  }, [refresh, syncFromStore]);

  return {
    ...state,
    refresh,
  };
}

export function useAuthAccess() {
  const requestIdRef = useRef(0);
  const [state, setState] = useState<AuthAccessState>(() => ({
    roles: isRealApiEnabled() ? [] : ["ADMIN"],
    canAccessElevatedModules: !isRealApiEnabled(),
    loading: isRealApiEnabled(),
    error: null,
  }));

  const refresh = useCallback(async () => {
    if (!isRealApiEnabled()) {
      setState({
        roles: ["ADMIN"],
        canAccessElevatedModules: true,
        loading: false,
        error: null,
      });
      return;
    }

    const currentRequestId = requestIdRef.current + 1;
    requestIdRef.current = currentRequestId;
    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const user = await authMe();
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
    void refresh();

    function handleSessionUpdate() {
      void refresh();
    }

    window.addEventListener(AUTH_SESSION_UPDATED_EVENT, handleSessionUpdate);
    window.addEventListener("storage", handleSessionUpdate);
    return () => {
      window.removeEventListener(AUTH_SESSION_UPDATED_EVENT, handleSessionUpdate);
      window.removeEventListener("storage", handleSessionUpdate);
    };
  }, [refresh]);

  return {
    ...state,
    refresh,
  };
}
