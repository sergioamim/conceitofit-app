import type { Page, Route } from "@playwright/test";

export type E2ETenantContextSeed = {
  id: string;
  nome: string;
  ativo?: boolean;
  academiaId?: string;
  groupId?: string;
};

export type E2EProtectedShellMockOptions = {
  currentTenantId?: string;
  tenants?: E2ETenantContextSeed[];
  user?: {
    id?: string;
    userId?: string;
    nome?: string;
    displayName?: string;
    email?: string;
    roles?: string[];
    userKind?: string;
    activeTenantId?: string;
    tenantBaseId?: string;
    availableTenants?: Array<{ tenantId: string; defaultTenant?: boolean }>;
    availableScopes?: string[];
    broadAccess?: boolean;
    redeId?: string | null;
    redeNome?: string | null;
    redeSlug?: string | null;
  };
  academia?: {
    id: string;
    nome: string;
    ativo?: boolean;
  };
  capabilities?: {
    canAccessElevatedModules?: boolean;
    canDeleteClient?: boolean;
  };
};

export type E2EProtectedShellController = {
  getCurrentTenantId: () => string;
  getCurrentTenant: () => E2ETenantContextSeed;
  getTenants: () => E2ETenantContextSeed[];
};

const DEFAULT_TENANTS: E2ETenantContextSeed[] = [
  {
    id: "tenant-centro",
    nome: "Unidade Centro",
    ativo: true,
    academiaId: "academia-e2e",
    groupId: "academia-e2e",
  },
];

function normalizePath(pathname: string) {
  return pathname.replace(/^\/backend/, "");
}

function buildAvailableTenants(tenants: E2ETenantContextSeed[], user?: E2EProtectedShellMockOptions["user"]) {
  if (user?.availableTenants?.length) {
    return user.availableTenants;
  }

  return tenants.map((tenant, index) => ({
    tenantId: tenant.id,
    defaultTenant: index === 0,
  }));
}

function buildUserPayload(
  tenants: E2ETenantContextSeed[],
  currentTenantId: string,
  options: E2EProtectedShellMockOptions,
) {
  const roles = options.user?.roles ?? ["ADMIN"];
  const availableTenants = buildAvailableTenants(tenants, options.user);

  return {
    id: options.user?.id ?? options.user?.userId ?? "user-e2e",
    userId: options.user?.userId ?? options.user?.id ?? "user-e2e",
    nome: options.user?.nome ?? "Usuário E2E",
    displayName: options.user?.displayName ?? options.user?.nome ?? "Usuário E2E",
    email: options.user?.email ?? "usuario.e2e@academia.local",
    roles,
    userKind: options.user?.userKind ?? "COLABORADOR",
    activeTenantId: options.user?.activeTenantId ?? currentTenantId,
    tenantBaseId: options.user?.tenantBaseId ?? currentTenantId,
    availableTenants,
    availableScopes: options.user?.availableScopes ?? ["UNIDADE"],
    broadAccess: options.user?.broadAccess ?? false,
    redeId: options.user?.redeId ?? null,
    redeNome: options.user?.redeNome ?? null,
    redeSlug: options.user?.redeSlug ?? null,
  };
}

function buildAcademiaPayload(
  tenant: E2ETenantContextSeed,
  options: E2EProtectedShellMockOptions,
) {
  return {
    id: options.academia?.id ?? tenant.academiaId ?? tenant.groupId ?? "academia-e2e",
    nome: options.academia?.nome ?? "Academia E2E",
    ativo: options.academia?.ativo ?? true,
  };
}

export async function fulfillJson(route: Route, json: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify(json),
  });
}

export async function installProtectedShellMocks(
  page: Page,
  options: E2EProtectedShellMockOptions = {},
): Promise<E2EProtectedShellController> {
  const tenants = options.tenants?.length
    ? options.tenants.map((tenant) => ({
        ativo: true,
        academiaId: tenant.academiaId ?? tenant.groupId ?? "academia-e2e",
        groupId: tenant.groupId ?? tenant.academiaId ?? "academia-e2e",
        ...tenant,
      }))
    : DEFAULT_TENANTS;
  let currentTenantId = options.currentTenantId ?? tenants[0]?.id ?? DEFAULT_TENANTS[0].id;

  const getCurrentTenant = () =>
    tenants.find((tenant) => tenant.id === currentTenantId) ?? tenants[0] ?? DEFAULT_TENANTS[0];

  const buildTenantContextPayload = () => ({
    currentTenantId,
    tenantAtual: getCurrentTenant(),
    unidadesDisponiveis: tenants,
  });

  await page.route("**/api/v1/auth/me**", async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }

    await fulfillJson(route, buildUserPayload(tenants, currentTenantId, options));
  });

  await page.route("**/api/v1/app/bootstrap**", async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }

    const currentTenant = getCurrentTenant();
    const user = buildUserPayload(tenants, currentTenantId, options);
    await fulfillJson(route, {
      user,
      tenantContext: buildTenantContextPayload(),
      academia: buildAcademiaPayload(currentTenant, options),
      capabilities: {
        canAccessElevatedModules:
          options.capabilities?.canAccessElevatedModules ?? user.roles.some((role) => role !== "VIEWER"),
        canDeleteClient: options.capabilities?.canDeleteClient ?? false,
      },
    });
  });

  await page.route("**/api/v1/context/unidade-ativa**", async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }

    await fulfillJson(route, buildTenantContextPayload());
  });

  await page.route("**/api/v1/context/unidade-ativa/**", async (route) => {
    const request = route.request();
    if (request.method() !== "PUT") {
      await route.fallback();
      return;
    }

    const url = new URL(request.url());
    const path = normalizePath(url.pathname);
    const match = path.match(/^\/api\/v1\/context\/unidade-ativa\/([^/]+)$/);

    if (!match) {
      await route.fallback();
      return;
    }

    const nextTenantId = decodeURIComponent(match[1] ?? "").trim();
    if (nextTenantId && tenants.some((tenant) => tenant.id === nextTenantId)) {
      currentTenantId = nextTenantId;
    }

    await fulfillJson(route, buildTenantContextPayload());
  });

  await page.route("**/api/v1/academia", async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }

    await fulfillJson(route, buildAcademiaPayload(getCurrentTenant(), options));
  });

  return {
    getCurrentTenantId: () => currentTenantId,
    getCurrentTenant,
    getTenants: () => tenants,
  };
}
