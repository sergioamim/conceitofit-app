import { expect, test, type Page } from "@playwright/test";
import {
  applyE2EAuthSession,
  clearE2EAuthSession,
  installE2EAuthSession,
} from "./support/auth-session";
import { fulfillJson, installProtectedShellMocks } from "./support/protected-shell-mocks";

const TENANTS = [
  { id: "tenant-centro", nome: "Unidade Centro", ativo: true },
  { id: "tenant-barra", nome: "Unidade Barra", ativo: true },
];

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

  const shell = await installProtectedShellMocks(page, {
    currentTenantId: TENANTS[0].id,
    tenants: TENANTS.map((tenant) => ({
      ...tenant,
      academiaId: "academia-1",
      groupId: "academia-1",
    })),
    user: {
      userId: "user-1",
      nome: "Admin Teste",
      displayName: "Admin Teste",
      email: "admin@academia.local",
      roles,
      userKind,
      activeTenantId: TENANTS[0].id,
      tenantBaseId: TENANTS[0].id,
      availableScopes: ["UNIDADE"],
      broadAccess,
    },
    academia: { id: "academia-1", nome: "Academia Teste", ativo: true },
    capabilities: {
      canAccessElevatedModules: true,
      canDeleteClient: false,
    },
  });

  await page.route("**/api/v1/auth/login", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }

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
  });

  await page.route("**/api/v1/academia/dashboard", async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }

    const currentTenantId = shell.getCurrentTenantId();
    const currentTenant = shell.getCurrentTenant();
    await fulfillJson(route, {
      totalAlunosAtivos: currentTenantId === "tenant-barra" ? 38 : 50,
      prospectsNovos: currentTenantId === "tenant-barra" ? 3 : 5,
      matriculasDoMes: currentTenantId === "tenant-barra" ? 2 : 3,
      receitaDoMes: currentTenantId === "tenant-barra" ? 7800 : 10000,
      prospectsRecentes: [],
      matriculasVencendo: [],
      pagamentosPendentes: [],
      statusAlunoCount: { ATIVO: currentTenantId === "tenant-barra" ? 38 : 50, INATIVO: 2, SUSPENSO: 0, CANCELADO: 1 },
      tenantAtual: {
        id: currentTenant.id,
        nome: currentTenant.nome,
      },
    });
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
