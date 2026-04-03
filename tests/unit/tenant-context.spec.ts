import { expect, test } from "@playwright/test";
import { DEFAULT_ACTIVE_TENANT_LABEL } from "../../src/lib/tenant/hooks/use-session-context";
import {
  clearAuthSession,
  getActiveTenantIdFromSession,
  getAvailableTenantsFromSession,
  rememberOperationalTenantScope,
  saveAuthSession,
} from "../../src/lib/api/session";
import {
  TENANT_CONTEXT_UPDATED_EVENT,
  dedupeTenants,
  getOptimisticTenantContextSnapshot,
  getSessionDefaultTenantId,
  getSessionTenantIds,
  getTenantContextSnapshotFromStore,
  resolveTenantContextSnapshot,
  syncTenantContextInStore,
  tenantContextNeedsRepair,
} from "../../src/lib/tenant/tenant-context";
import { installMockBrowser } from "./support/test-runtime";

let browser: ReturnType<typeof installMockBrowser> | undefined;

const TENANT_CENTRO = {
  id: "tenant-centro",
  nome: "Centro",
  ativo: true,
};

const TENANT_SUL = {
  id: "tenant-sul",
  nome: "Sul",
  ativo: true,
};

const TENANT_INATIVO = {
  id: "tenant-inativo",
  nome: "Inativo",
  ativo: false,
};

test.beforeEach(() => {
  browser = installMockBrowser();
  clearAuthSession();
});

test.afterEach(() => {
  clearAuthSession();
  browser?.restore();
});

test.describe("tenant context", () => {
  test("mantém fallback textual estável quando não há unidade resolvida", () => {
    const snapshot = resolveTenantContextSnapshot({});

    expect(snapshot.tenant).toBeNull();
    expect(snapshot.tenantId).toBe("");
    expect(snapshot.tenantName).toBe(DEFAULT_ACTIVE_TENANT_LABEL);
    expect(snapshot.tenants).toEqual([]);
    expect(snapshot.tenantResolved).toBe(false);
  });

  test("deduplica tenants e resolve snapshot priorizando sessao e tenant valido", () => {
    saveAuthSession({
      token: "token",
      refreshToken: "refresh",
      activeTenantId: "tenant-sul",
      availableTenants: [
        { tenantId: "tenant-sul", defaultTenant: false },
        { tenantId: "tenant-centro", defaultTenant: true },
        { tenantId: "tenant-sul", defaultTenant: false },
      ],
    });

    expect(getSessionTenantIds()).toEqual(["tenant-sul", "tenant-centro"]);
    expect(getSessionDefaultTenantId()).toBe("tenant-centro");
    expect(
      dedupeTenants([
        TENANT_CENTRO,
        { ...TENANT_CENTRO, nome: "Centro duplicado" },
        TENANT_SUL,
      ])
    ).toEqual([TENANT_CENTRO, TENANT_SUL]);

    const snapshot = resolveTenantContextSnapshot({
      currentTenantId: "tenant-sul",
      tenantAtual: TENANT_INATIVO,
      tenants: [TENANT_CENTRO, TENANT_SUL, TENANT_INATIVO],
    });

    expect(snapshot.tenantId).toBe("tenant-sul");
    expect(snapshot.tenant?.id).toBe("tenant-sul");
    expect(snapshot.tenants.map((tenant) => tenant.id)).toEqual(["tenant-sul", "tenant-centro"]);
    expect(snapshot.tenantResolved).toBe(true);

    expect(
      tenantContextNeedsRepair({
        currentTenantId: "tenant-inexistente",
        tenantAtual: TENANT_CENTRO,
        tenants: [TENANT_CENTRO],
      })
    ).toBe(true);
  });

  test("sincroniza store local, atualiza sessao e preserva snapshot otimista", () => {
    const notifications: string[] = [];
    window.addEventListener(TENANT_CONTEXT_UPDATED_EVENT, () => {
      notifications.push("updated");
    });

    const synced = syncTenantContextInStore({
      currentTenantId: "tenant-centro",
      tenantAtual: TENANT_CENTRO,
      tenants: [TENANT_CENTRO, TENANT_SUL],
    });

    expect(synced.tenantName).toBe("Centro");
    expect(getActiveTenantIdFromSession()).toBe("tenant-centro");
    expect(getAvailableTenantsFromSession()).toEqual([
      { tenantId: "tenant-centro", defaultTenant: true },
      { tenantId: "tenant-sul", defaultTenant: false },
    ]);
    expect(getTenantContextSnapshotFromStore()).toEqual({
      tenant: TENANT_CENTRO,
      tenantId: "tenant-centro",
      tenantName: "Centro",
      tenants: [TENANT_CENTRO, TENANT_SUL],
      tenantResolved: true,
    });
    expect(notifications.length).toBeGreaterThan(0);

    clearAuthSession();
    const optimistic = getOptimisticTenantContextSnapshot();
    expect(optimistic.tenant?.id).toBe("tenant-centro");
    expect(optimistic.tenants).toEqual([TENANT_CENTRO]);
  });

  test("restringe o contexto a academia selecionada ao entrar como unidade", () => {
    saveAuthSession({
      token: "token",
      refreshToken: "refresh",
      activeTenantId: "tenant-mananciais-s1",
      tenantBaseId: "tenant-centro",
      availableTenants: [
        { tenantId: "tenant-centro", defaultTenant: true },
        { tenantId: "tenant-mananciais-s1", defaultTenant: false },
        { tenantId: "tenant-norte", defaultTenant: false },
      ],
    });
    rememberOperationalTenantScope({
      academiaId: "academia-mananciais",
      tenantIds: ["tenant-mananciais-s1"],
      defaultTenantId: "tenant-mananciais-s1",
    });

    const snapshot = resolveTenantContextSnapshot({
      currentTenantId: "tenant-mananciais-s1",
      tenantAtual: { id: "tenant-mananciais-s1", nome: "Mananciais S1", ativo: true },
      tenants: [
        TENANT_CENTRO,
        { id: "tenant-mananciais-s1", nome: "Mananciais S1", ativo: true },
        { id: "tenant-norte", nome: "Norte", ativo: true },
      ],
    });

    expect(getAvailableTenantsFromSession()).toEqual([
      { tenantId: "tenant-mananciais-s1", defaultTenant: true },
    ]);
    expect(snapshot.tenantId).toBe("tenant-mananciais-s1");
    expect(snapshot.tenants.map((tenant) => tenant.id)).toEqual(["tenant-mananciais-s1"]);
  });
});
