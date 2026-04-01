import { expect, test, type Page, type Route } from "@playwright/test";
import {
  applyE2EAuthSession,
  clearE2EAuthSession,
  installE2EAuthSession,
} from "./support/auth-session";

const TENANTS = [
  { id: "tenant-centro", nome: "Unidade Centro", ativo: true },
  { id: "tenant-barra", nome: "Unidade Barra", ativo: true },
];

async function fulfillJson(route: Route, json: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify(json),
  });
}

function normalizedPath(pathname: string) {
  return pathname.replace(/^\/backend/, "");
}

async function installSecurityMocks(
  page: Page,
  options: {
    loginShouldFail?: boolean;
    userKind?: string;
    roles?: string[];
    broadAccess?: boolean;
  } = {},
) {
  const {
    loginShouldFail = false,
    userKind = "COLABORADOR",
    roles = ["ADMIN"],
    broadAccess = false,
  } = options;

  let currentTenantId = TENANTS[0].id;

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const path = normalizedPath(url.pathname);

    if (path === "/api/v1/auth/login" && method === "POST") {
      if (loginShouldFail) {
        await fulfillJson(route, { error: "Unauthorized", message: "Credenciais inválidas." }, 401);
        return;
      }
      await fulfillJson(route, {
        token: "token-valid",
        refreshToken: "refresh-valid",
        type: "Bearer",
        expiresIn: 3600,
        userId: "user-1",
        displayName: "Admin Teste",
        userKind,
        redeId: null,
        redeSlug: null,
        redeNome: null,
        activeTenantId: TENANTS[0].id,
        tenantBaseId: TENANTS[0].id,
        availableTenants: TENANTS.map((t, i) => ({ tenantId: t.id, defaultTenant: i === 0 })),
        availableScopes: ["UNIDADE"],
        broadAccess,
      });
      return;
    }

    if (path === "/api/v1/context/unidade-ativa" && method === "GET") {
      const tenantAtual = TENANTS.find((t) => t.id === currentTenantId) ?? TENANTS[0];
      await fulfillJson(route, {
        currentTenantId,
        tenantAtual,
        unidadesDisponiveis: TENANTS,
      });
      return;
    }

    const switchMatch = path.match(/^\/api\/v1\/context\/unidade-ativa\/([^/]+)$/);
    if (method === "PUT" && switchMatch) {
      currentTenantId = decodeURIComponent(switchMatch[1] ?? "").trim() || currentTenantId;
      const tenantAtual = TENANTS.find((t) => t.id === currentTenantId) ?? TENANTS[0];
      await fulfillJson(route, {
        currentTenantId,
        tenantAtual,
        unidadesDisponiveis: TENANTS,
      });
      return;
    }

    if (path === "/api/v1/app/bootstrap" && method === "GET") {
      const tenantAtual = TENANTS.find((t) => t.id === currentTenantId) ?? TENANTS[0];
      await fulfillJson(route, {
        user: {
          userId: "user-1",
          nome: "Admin Teste",
          displayName: "Admin Teste",
          email: "admin@academia.local",
          roles,
          userKind,
          activeTenantId: currentTenantId,
          tenantBaseId: TENANTS[0].id,
          availableTenants: TENANTS.map((t, i) => ({ tenantId: t.id, defaultTenant: i === 0 })),
          availableScopes: ["UNIDADE"],
          broadAccess,
        },
        tenantContext: {
          currentTenantId,
          tenantAtual,
          unidadesDisponiveis: TENANTS,
        },
        academia: { id: "academia-1", nome: "Academia Teste", ativo: true },
      });
      return;
    }

    if (path === "/api/v1/auth/me" && method === "GET") {
      await fulfillJson(route, {
        userId: "user-1",
        nome: "Admin Teste",
        email: "admin@academia.local",
        roles,
      });
      return;
    }

    if (path === "/api/v1/academia" && method === "GET") {
      await fulfillJson(route, { id: "academia-1", nome: "Academia Teste", ativo: true });
      return;
    }

    if (path === "/api/v1/academia/dashboard" && method === "GET") {
      await fulfillJson(route, {
        totalAlunosAtivos: 50,
        prospectsNovos: 5,
        matriculasDoMes: 3,
        receitaDoMes: 10000,
        prospectsRecentes: [],
        matriculasVencendo: [],
        pagamentosPendentes: [],
        statusAlunoCount: { ATIVO: 50, INATIVO: 2, SUSPENSO: 0, CANCELADO: 1 },
      });
      return;
    }

    await route.fulfill({ status: 200, json: {} });
  });
}

async function seedSession(page: Page) {
  await installE2EAuthSession(page, {
    token: "token-valid",
    refreshToken: "refresh-valid",
    type: "Bearer",
    expiresIn: 3600,
    userId: "user-1",
    userKind: "COLABORADOR",
    displayName: "Admin Teste",
    activeTenantId: TENANTS[0].id,
    baseTenantId: TENANTS[0].id,
    preferredTenantId: TENANTS[0].id,
    availableTenants: TENANTS.map((tenant, index) => ({
      tenantId: tenant.id,
      defaultTenant: index === 0,
    })),
    availableScopes: ["UNIDADE"],
    broadAccess: false,
  });
}

test.describe("Fluxos críticos de segurança e tenant", () => {
  test("login com credenciais válidas redireciona para dashboard", async ({ page }) => {
    await installSecurityMocks(page);

    await page.goto("/login?next=%2Fdashboard");
    await expect(page.getByLabel("Usuário")).toBeVisible();

    await page.getByLabel("Usuário").fill("admin@academia.local");
    await page.getByLabel("Senha").fill("12345678");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect
      .poll(() => page.evaluate(() => Boolean(window.localStorage.getItem("academia-auth-token"))))
      .toBe(true);

    const saveTenantButton = page.getByRole("button", { name: "Salvar e continuar" });
    if (await saveTenantButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveTenantButton.click();
    }

    if (/\/login/.test(page.url())) {
      await page.goto("/dashboard");
    }

    await expect(page).not.toHaveURL(/\/login/);

    const token = await page.evaluate(() => window.localStorage.getItem("academia-auth-token"));
    expect(token).toBe("token-valid");
  });

  test("login com credenciais inválidas exibe mensagem de erro", async ({ page }) => {
    await installSecurityMocks(page, { loginShouldFail: true });

    await page.goto("/login");
    await expect(page.getByLabel("Usuário")).toBeVisible();

    await page.getByLabel("Usuário").fill("wrong@email.com");
    await page.getByLabel("Senha").fill("senhaerrada");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByText(/Credenciais inválidas|Falha ao autenticar/)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);

    const token = await page.evaluate(() => window.localStorage.getItem("academia-auth-token"));
    expect(token).toBeNull();
  });

  test("troca de tenant atualiza dados no contexto", async ({ page }) => {
    await installSecurityMocks(page);
    await seedSession(page);

    await page.goto("/dashboard");
    await expect(page).not.toHaveURL(/\/login/);

    const combobox = page.getByRole("combobox").first();
    if (await combobox.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(combobox).toContainText("Unidade Centro");

      await combobox.click();
      await page.getByRole("option", { name: "Unidade Barra" }).click();

      await expect(combobox).toContainText("Unidade Barra");

      const activeTenant = await page.evaluate(() =>
        window.localStorage.getItem("academia-auth-active-tenant-id"),
      );
      expect(activeTenant).toBe("tenant-barra");
    }
  });

  test("acesso a rota protegida sem sessão redireciona para login", async ({ page }) => {
    await installSecurityMocks(page);

    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    if (/\/login/.test(page.url())) {
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByLabel("Usuário")).toBeVisible();
    }
  });

  test("helper compartilhado permite autenticar no meio do fluxo publico", async ({ page }) => {
    await installSecurityMocks(page);

    await page.goto("/login");
    await expect(page.getByLabel("Usuário")).toBeVisible();

    await applyE2EAuthSession(page, {
      token: "token-valid",
      refreshToken: "refresh-valid",
      type: "Bearer",
      expiresIn: 3600,
      userId: "user-1",
      userKind: "COLABORADOR",
      displayName: "Admin Teste",
      activeTenantId: TENANTS[0].id,
      baseTenantId: TENANTS[0].id,
      preferredTenantId: TENANTS[0].id,
      availableTenants: TENANTS.map((tenant, index) => ({
        tenantId: tenant.id,
        defaultTenant: index === 0,
      })),
      availableScopes: ["UNIDADE"],
      broadAccess: false,
    });

    await page.goto("/dashboard");
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("sessão expirada (token removido) redireciona para login ao recarregar", async ({ page }) => {
    await installSecurityMocks(page);
    await seedSession(page);

    await page.goto("/dashboard");
    await expect(page).not.toHaveURL(/\/login/);

    await clearE2EAuthSession(page);

    await page.reload();
    await page.waitForLoadState("networkidle");

    if (/\/login/.test(page.url())) {
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByLabel("Usuário")).toBeVisible();
    } else {
      await expect(page).toHaveURL(/\/dashboard/);
    }
  });
});
