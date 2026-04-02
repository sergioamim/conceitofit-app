import { expect, test, type Page, type Request, type Route } from "@playwright/test";
import { seedAuthenticatedSession } from "./support/backend-only-stubs";
import { E2E_AUTH_SESSION_STORAGE_KEYS } from "./support/auth-session";
import { installOperationalAppShellMocks } from "./support/protected-shell-mocks";

const SESSION_KEYS = [...E2E_AUTH_SESSION_STORAGE_KEYS];
const E2E_BASE_URL = process.env.PLAYWRIGHT_BASE_URL?.trim() || "http://localhost:3000";

async function fulfillJson(route: Route, json: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify(json),
  });
}

function getTenantId(request: Request) {
  return new URL(request.url()).searchParams.get("tenantId")?.trim() ?? "";
}

async function installSessionAuthMocks(page: Page) {
  const tenants = [
    {
      id: "tenant-s1",
      nome: "MANANCIAIS - S1",
      academiaId: "academia-1",
      ativo: true,
    },
    {
      id: "tenant-s3",
      nome: "PECHINCHA - S3",
      academiaId: "academia-1",
      ativo: true,
    },
  ];

  await installOperationalAppShellMocks(page, {
    currentTenantId: tenants[0].id,
    tenants: tenants.map((tenant) => ({
      ...tenant,
      groupId: "academia-1",
    })),
    user: {
      id: "user-admin",
      userId: "user-admin",
      nome: "Admin Multiunidade",
      displayName: "Admin Multiunidade",
      email: "admin@academia.local",
      roles: ["OWNER", "ADMIN"],
      userKind: "COLABORADOR",
      activeTenantId: tenants[0].id,
      tenantBaseId: tenants[0].id,
      availableTenants: tenants.map((tenant, index) => ({
        tenantId: tenant.id,
        defaultTenant: index === 0,
      })),
      availableScopes: ["UNIDADE"],
      broadAccess: false,
      redeId: "academia-1",
      redeNome: "Academia Fit",
      redeSlug: "academia-fit",
    },
    academia: { id: "academia-1", nome: "Academia Fit", ativo: true },
    capabilities: { canAccessElevatedModules: true, canDeleteClient: false },
    routes: {
      tenantContext: false,
      authRefresh: false,
    },
  });

  await page.route("**/api/v1/auth/refresh", async (route) => {
    await fulfillJson(route, {
      token: "token-e2e",
      refreshToken: "refresh-e2e",
      type: "Bearer",
    });
  });
}

async function mockContasBancariasByTenant(page: Page, initialTenantId = "tenant-s1") {
  const missingTenantRequests: string[] = [];
  const requestedTenantIds: string[] = [];
  const tenants = [
    {
      id: "tenant-s1",
      nome: "MANANCIAIS - S1",
      ativo: true,
    },
    {
      id: "tenant-s3",
      nome: "PECHINCHA - S3",
      ativo: true,
    },
  ];
  let currentTenantId = initialTenantId;
  let primaryTenantId = "";
  let secondaryTenantId = "";

  await page.route("**/api/v1/context/unidade-ativa**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/backend/, "");

    if (request.method() === "GET" && path === "/api/v1/context/unidade-ativa") {
      const tenantAtual = tenants.find((tenant) => tenant.id === currentTenantId) ?? tenants[0];
      await fulfillJson(route, {
        currentTenantId,
        tenantAtual,
        unidadesDisponiveis: tenants,
      });
      return;
    }

    const match = path.match(/^\/api\/v1\/context\/unidade-ativa\/([^/]+)$/);
    if (request.method() === "PUT" && match) {
      currentTenantId = decodeURIComponent(match[1] ?? "").trim() || currentTenantId;
      const tenantAtual = tenants.find((tenant) => tenant.id === currentTenantId) ?? tenants[0];
      await fulfillJson(route, {
        currentTenantId,
        tenantAtual,
        unidadesDisponiveis: tenants,
      });
      return;
    }

    await fulfillJson(route, { message: `Unhandled ${request.method()} ${path}` }, 404);
  });

  await page.route("**/api/v1/gerencial/financeiro/contas-bancarias**", async (route) => {
    const request = route.request();
    const tenantId = getTenantId(request) || currentTenantId;
    requestedTenantIds.push(tenantId);

    if (!tenantId) {
      missingTenantRequests.push(`${request.method()} ${request.url()}`);
      await fulfillJson(route, { message: "tenantId obrigatório" }, 400);
      return;
    }

    if (!primaryTenantId) {
      primaryTenantId = tenantId;
    } else if (!secondaryTenantId && tenantId !== primaryTenantId) {
      secondaryTenantId = tenantId;
    }

    const isSecondaryTenant = Boolean(secondaryTenantId) && tenantId === secondaryTenantId;
    const payload =
      isSecondaryTenant
        ? [
            {
              id: "conta-s3-001",
              tenantId,
              apelido: "Conta S3 Principal",
              banco: "Banco S3",
              agencia: "3003",
              conta: "300300",
              digito: "3",
              tipo: "CORRENTE",
              titular: "Academia Pechincha",
              pixChave: "s3@academia.local",
              pixTipo: "EMAIL",
              statusCadastro: "ATIVA",
            },
          ]
        : [
            {
              id: "conta-s1-001",
              tenantId,
              apelido: "Conta S1 Principal",
              banco: "Banco S1",
              agencia: "1001",
              conta: "100100",
              digito: "1",
              tipo: "CORRENTE",
              titular: "Academia Mananciais",
              pixChave: "s1@academia.local",
              pixTipo: "EMAIL",
              statusCadastro: "ATIVA",
            },
          ];

    await fulfillJson(route, payload);
  });

  return {
    missingTenantRequests,
    requestedTenantIds,
    get primaryTenantId() {
      return primaryTenantId;
    },
    get secondaryTenantId() {
      return secondaryTenantId;
    },
  };
}

async function openAuthenticatedPage(
  page: Page,
  path: string,
  options?: { tenantId?: string; tenantName?: string }
) {
  const tenantId = options?.tenantId ?? "tenant-s1";
  const tenantName = options?.tenantName ?? (tenantId === "tenant-s3" ? "PECHINCHA - S3" : "MANANCIAIS - S1");
  await seedAuthenticatedSession(page, {
    tenantId,
    availableTenants: [
      { tenantId: "tenant-s1", defaultTenant: true },
      { tenantId: "tenant-s3", defaultTenant: false },
    ],
  });
  await installSessionAuthMocks(page);
  await page.context().addCookies([
    { name: "academia-active-tenant-id", value: tenantId, url: E2E_BASE_URL },
    { name: "academia-active-tenant-name", value: tenantName, url: E2E_BASE_URL },
  ]);
  await page.goto(path);
  await expect(page).not.toHaveURL(/\/login/);
}

test.describe("Sessão e multiunidade", () => {
  test("redireciona para login quando a API devolve 401 e o refresh também expira", async ({ page }) => {
    await installSessionAuthMocks(page);
    await mockContasBancariasByTenant(page);
    await openAuthenticatedPage(page, "/administrativo/contas-bancarias");

    await expect(page).toHaveURL(/\/administrativo\/contas-bancarias$/);
    await expect(page.getByRole("heading", { name: "Contas bancárias" })).toBeVisible();

    await page.route("**/api/v1/auth/refresh", async (route) => {
      await fulfillJson(route, { message: "Sessão expirada." }, 401);
    });
    await page.route("**/api/v1/gerencial/financeiro/contas-bancarias**", async (route) => {
      if (route.request().method() !== "GET") {
        await route.fallback();
        return;
      }
      await fulfillJson(route, { message: "Sessão expirada." }, 401);
    });

    await page.reload();
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/\/login\?next=%2Fadministrativo%2Fcontas-bancarias/);
    await expect(page.getByLabel("Usuário")).toBeVisible();
  });

  test("preserva deep link, troca unidade, mantém contexto no refresh e recupera após perda de sessão", async ({ page }) => {
    await installSessionAuthMocks(page);
    const contasMock = await mockContasBancariasByTenant(page, "tenant-s3");
    await openAuthenticatedPage(page, "/administrativo/contas-bancarias", {
      tenantId: "tenant-s3",
      tenantName: "PECHINCHA - S3",
    });

    await expect(page).toHaveURL(/\/administrativo\/contas-bancarias$/);
    await expect(page.getByRole("heading", { name: "Contas bancárias" })).toBeVisible();
    await expect(page.getByRole("combobox").first()).toContainText("PECHINCHA - S3");
    await expect.poll(() => contasMock.primaryTenantId).toBe("tenant-s3");

    await page.reload();

    await expect(page.getByRole("heading", { name: "Contas bancárias" })).toBeVisible();
    await expect(page.getByRole("combobox").first()).toContainText("PECHINCHA - S3");
    await expect.poll(() => contasMock.requestedTenantIds.filter((tenantId) => tenantId === "tenant-s3").length).toBeGreaterThan(0);

    await page.evaluate((keys) => {
      keys.forEach((key) => window.localStorage.removeItem(key));
    }, SESSION_KEYS);

    await page.reload();
    await page.waitForLoadState("networkidle");

    if (/\/login/.test(page.url())) {
      await expect(page).toHaveURL(/\/login\?next=%2Fadministrativo%2Fcontas-bancarias/);
      await expect(page.getByText("Acesso")).toBeVisible();
    } else {
      await expect(page).toHaveURL(/\/administrativo\/contas-bancarias$/);
      await expect(page.getByRole("heading", { name: "Contas bancárias" })).toBeVisible();
    }

    expect(contasMock.missingTenantRequests).toEqual([]);
  });
});
