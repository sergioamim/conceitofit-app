"use client";

import {
  getActiveTenantIdFromSession,
  getAvailableTenantsFromSession,
  setActiveTenantId,
  setAvailableTenants,
} from "@/lib/api/session";
import type { Tenant } from "@/lib/types";

export const TENANT_CONTEXT_UPDATED_EVENT = "academia-tenant-context-updated";

export type TenantContextSnapshot = {
  tenant: Tenant | null;
  tenantId: string;
  tenantName: string;
  tenants: Tenant[];
  tenantResolved: boolean;
};

type TenantContextInput = {
  currentTenantId?: string | null;
  tenantAtual?: Tenant | null;
  tenants?: Tenant[];
};

type TenantContextMemory = {
  currentTenantId?: string;
  tenantAtual?: Tenant | null;
  tenants: Tenant[];
};

let tenantContextMemory: TenantContextMemory = {
  currentTenantId: undefined,
  tenantAtual: null,
  tenants: [],
};

export function resetTenantContextMemory(): void {
  tenantContextMemory = {
    currentTenantId: undefined,
    tenantAtual: null,
    tenants: [],
  };
}

function normalizeTenantId(value: string | null | undefined): string | undefined {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || undefined;
}

function dedupeTenantAccess() {
  const seen = new Set<string>();
  return getAvailableTenantsFromSession().filter((item) => {
    const tenantId = normalizeTenantId(item.tenantId);
    if (!tenantId || seen.has(tenantId)) return false;
    seen.add(tenantId);
    return true;
  });
}

function notifyTenantContextUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(TENANT_CONTEXT_UPDATED_EVENT));
}

export function getSessionTenantIds(): string[] {
  return dedupeTenantAccess()
    .map((item) => normalizeTenantId(item.tenantId))
    .filter((tenantId): tenantId is string => Boolean(tenantId));
}

export function getSessionDefaultTenantId(): string | undefined {
  const access = dedupeTenantAccess();
  const defaultTenantId = access.find((item) => item.defaultTenant)?.tenantId;
  return normalizeTenantId(defaultTenantId) ?? normalizeTenantId(access[0]?.tenantId);
}

export function dedupeTenants(items: Tenant[]): Tenant[] {
  const map = new Map<string, Tenant>();
  for (const tenant of items) {
    const tenantId = normalizeTenantId(tenant?.id);
    if (!tenant || !tenantId || map.has(tenantId)) continue;
    map.set(tenantId, { ...tenant, id: tenantId });
  }
  return Array.from(map.values());
}

function orderTenantsBySessionPreference(items: Tenant[]): Tenant[] {
  const deduped = dedupeTenants(items);
  const sessionIds = getSessionTenantIds();
  if (sessionIds.length === 0) return deduped;

  const byId = new Map(deduped.map((tenant) => [tenant.id, tenant] as const));
  const prioritized = sessionIds
    .map((tenantId) => byId.get(tenantId))
    .filter((tenant): tenant is Tenant => Boolean(tenant));
  const prioritizedIds = new Set(prioritized.map((tenant) => tenant.id));
  const remaining = deduped.filter((tenant) => !prioritizedIds.has(tenant.id));
  return [...prioritized, ...remaining];
}

function filterTenantCandidates(items: Tenant[]): Tenant[] {
  const ordered = orderTenantsBySessionPreference(items);
  const sessionIds = getSessionTenantIds();
  const allowed = sessionIds.length
    ? ordered.filter((tenant) => sessionIds.includes(tenant.id))
    : ordered;
  const activeOnly = allowed.filter((tenant) => tenant.ativo !== false);
  if (activeOnly.length > 0) return activeOnly;
  if (allowed.length > 0) return allowed;
  const allActive = ordered.filter((tenant) => tenant.ativo !== false);
  return allActive.length > 0 ? allActive : ordered;
}

export function resolveTenantContextSnapshot(input: TenantContextInput): TenantContextSnapshot {
  const sourceTenants = dedupeTenants([
    ...(input.tenants ?? []),
    ...(input.tenantAtual ? [input.tenantAtual] : []),
  ]);
  const candidateTenants = filterTenantCandidates(sourceTenants);
  const requestedCurrentTenantId = normalizeTenantId(input.currentTenantId);
  const tenantAtualId = normalizeTenantId(input.tenantAtual?.id);
  const sessionActiveTenantId = normalizeTenantId(getActiveTenantIdFromSession());
  const sessionDefaultTenantId = getSessionDefaultTenantId();

  const selectedTenant =
    [requestedCurrentTenantId, tenantAtualId, sessionActiveTenantId, sessionDefaultTenantId]
      .map((tenantId) => (tenantId ? candidateTenants.find((tenant) => tenant.id === tenantId) : undefined))
      .find((tenant): tenant is Tenant => Boolean(tenant))
    ?? (tenantAtualId ? sourceTenants.find((tenant) => tenant.id === tenantAtualId) : undefined)
    ?? candidateTenants[0]
    ?? input.tenantAtual
    ?? null;

  const selectedTenantId =
    normalizeTenantId(selectedTenant?.id)
    ?? requestedCurrentTenantId
    ?? tenantAtualId
    ?? sessionActiveTenantId
    ?? sessionDefaultTenantId
    ?? "";

  const tenants = selectedTenant
    ? [selectedTenant, ...candidateTenants.filter((tenant) => tenant.id !== selectedTenant.id)]
    : candidateTenants;

  return {
    tenant: selectedTenant,
    tenantId: selectedTenantId,
    tenantName: selectedTenant?.nome?.trim() || "Unidade ativa",
    tenants,
    tenantResolved: Boolean(selectedTenant),
  };
}

export function getTenantContextSnapshotFromStore(): TenantContextSnapshot {
  return resolveTenantContextSnapshot(tenantContextMemory);
}

export function getOptimisticTenantContextSnapshot(): TenantContextSnapshot {
  const snapshot = getTenantContextSnapshotFromStore();
  const hasSessionContext =
    Boolean(normalizeTenantId(getActiveTenantIdFromSession())) || getSessionTenantIds().length > 0;
  if (hasSessionContext || !snapshot.tenant) return snapshot;
  return {
    ...snapshot,
    tenants: snapshot.tenant ? [snapshot.tenant] : [],
  };
}

export function tenantContextNeedsRepair(input: TenantContextInput): boolean {
  const currentTenantId = normalizeTenantId(input.currentTenantId);
  const snapshot = resolveTenantContextSnapshot(input);
  if (!snapshot.tenantId) return false;
  return !currentTenantId || !snapshot.tenants.some((tenant) => tenant.id === currentTenantId);
}

export function syncTenantContextInStore(input: TenantContextInput): TenantContextSnapshot {
  const snapshot = resolveTenantContextSnapshot(input);
  const currentSessionTenantId = normalizeTenantId(getActiveTenantIdFromSession());
  if (snapshot.tenantId && currentSessionTenantId !== snapshot.tenantId) {
    setActiveTenantId(snapshot.tenantId);
  }
  if (snapshot.tenants.length > 0) {
    const nextTenantIds = snapshot.tenants.map((tenant) => tenant.id);
    const currentAccess = dedupeTenantAccess();
    const defaultTenantId = snapshot.tenantId || snapshot.tenants[0]?.id;
    const hasSameAvailableTenants =
      currentAccess.length === nextTenantIds.length
      && currentAccess.every(
        (item, index) =>
          item.tenantId === nextTenantIds[index]
          && item.defaultTenant === (item.tenantId === defaultTenantId)
      );

    if (!hasSameAvailableTenants) {
      setAvailableTenants(nextTenantIds, defaultTenantId);
    }
  }

  tenantContextMemory = {
    currentTenantId: snapshot.tenantId || undefined,
    tenantAtual: snapshot.tenant,
    tenants: snapshot.tenants,
  };

  notifyTenantContextUpdated();
  return snapshot;
}
