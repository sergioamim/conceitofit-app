import { expect, test, type Page } from "@playwright/test";
import { applyE2EAuthSession } from "./support/auth-session";
import { installProtectedShellMocks } from "./support/protected-shell-mocks";

const DEMO_API_PATTERN = "**/api/v1/publico/demo";

const DEMO_TENANT = {
  id: "tenant-demo-001",
  nome: "Unidade Demo",
  ativo: true,
  subdomain: "demo",
  academiaId: "academia-demo-001",
  academiaNome: "Academia Demo",
};

const DEMO_ACADEMIA = {
  id: "academia-demo-001",
  nome: "Academia Demo",
  ativo: true,
};

const DEMO_RESPONSE = {
  token: "demo-jwt-token-abc123",
  refreshToken: "demo-refresh-token-xyz",
  type: "Bearer",
  expiresIn: 604800,
  userId: "usr-demo-001",
  userKind: "DEMO",
  displayName: "Tester Demo",
  activeTenantId: "tenant-demo-001",
  tenantBaseId: "tenant-demo-001",
  redeId: "rede-demo-001",
  redeSubdominio: "demo",
  redeSlug: "demo",
  redeNome: "Academia Demo",
  availableTenants: [{ tenantId: "tenant-demo-001", defaultTenant: true }],
  availableScopes: ["UNIDADE"],
  broadAccess: false,
};

async function mockDemoApi(page: Page, status = 200, body: unknown = DEMO_RESPONSE) {
  await page.route(DEMO_API_PATTERN, (route) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(body),
    }),
  );
}

async function installDemoBootstrapMocks(page: Page) {
  await installProtectedShellMocks(page, {
    currentTenantId: DEMO_TENANT.id,
    tenants: [
      {
        ...DEMO_TENANT,
        groupId: DEMO_ACADEMIA.id,
      },
    ],
    user: {
      userId: DEMO_RESPONSE.userId,
      nome: DEMO_RESPONSE.displayName,
      displayName: DEMO_RESPONSE.displayName,
      email: "demo@conceito.fit",
      roles: ["ADMIN"],
      userKind: DEMO_RESPONSE.userKind,
      activeTenantId: DEMO_RESPONSE.activeTenantId,
      tenantBaseId: DEMO_RESPONSE.tenantBaseId,
      availableTenants: DEMO_RESPONSE.availableTenants,
      availableScopes: DEMO_RESPONSE.availableScopes,
      broadAccess: DEMO_RESPONSE.broadAccess,
      redeId: DEMO_RESPONSE.redeId,
      redeNome: DEMO_RESPONSE.redeNome,
      redeSlug: DEMO_RESPONSE.redeSlug,
    },
    academia: DEMO_ACADEMIA,
    capabilities: {
      canAccessElevatedModules: false,
      canDeleteClient: false,
    },
  });

  await page.route("**/api/v1/academia/dashboard**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        json: {
          totalAlunosAtivos: 25,
          prospectsNovos: 3,
          prospectsNovosAnterior: 2,
          matriculasDoMes: 2,
          matriculasDoMesAnterior: 1,
          receitaDoMes: 1500,
          receitaDoMesAnterior: 1200,
          visitasAguardandoRetorno: 1,
          followupPendente: 0,
          prospectsRecentes: [],
          matriculasVencendo: [],
          pagamentosPendentes: [],
          statusAlunoCount: {
            ATIVO: 25,
            INATIVO: 0,
            SUSPENSO: 0,
            CANCELADO: 0,
          },
        },
      });
      return;
    }
    await route.fallback();
  });

  await page.route("**/api/v1/comercial/pagamentos**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        json: [],
      });
      return;
    }
    await route.fallback();
  });

  await page.route("**/api/v1/comercial/alunos**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        json: [],
      });
      return;
    }
    await route.fallback();
  });

  await page.route("**/api/v1/matriculas**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        json: [],
      });
      return;
    }
    await route.fallback();
  });

  await page.route("**/api/v1/formas-pagamento**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        json: [],
      });
      return;
    }
    await route.fallback();
  });

  await page.route("**/api/v1/beneficios/convenios**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        json: [],
      });
      return;
    }
    await route.fallback();
  });

  await page.route("**/api/v1/admin-financeiro/nfse-config**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        json: {
          status: "CONFIGURADO",
          provider: "MOCK",
          ambiente: "HOMOLOGACAO",
        },
      });
      return;
    }
    await route.fallback();
  });

  await page.route("**/api/v1/onboarding/status**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        json: {
          percentualConclusao: 100,
          concluido: true,
          totalEtapas: 0,
          etapasConcluidas: 0,
          etapas: [],
        },
      });
      return;
    }
    await route.fallback();
  });
}

async function seedDemoSession(page: Page) {
  if (page.url() === "about:blank") {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
  }

  await applyE2EAuthSession(page, {
    token: DEMO_RESPONSE.token,
    refreshToken: DEMO_RESPONSE.refreshToken,
    type: DEMO_RESPONSE.type,
    expiresIn: DEMO_RESPONSE.expiresIn,
    userId: DEMO_RESPONSE.userId,
    userKind: DEMO_RESPONSE.userKind,
    displayName: DEMO_RESPONSE.displayName,
    activeTenantId: DEMO_RESPONSE.activeTenantId,
    baseTenantId: DEMO_RESPONSE.tenantBaseId,
    availableTenants: DEMO_RESPONSE.availableTenants,
    availableScopes: DEMO_RESPONSE.availableScopes,
    broadAccess: DEMO_RESPONSE.broadAccess,
    networkId: DEMO_RESPONSE.redeId,
    networkSubdomain: DEMO_RESPONSE.redeSubdominio,
    networkSlug: DEMO_RESPONSE.redeSlug,
    networkName: DEMO_RESPONSE.redeNome,
  });
}

async function navigateToDemo(page: Page) {
  await page.goto("/b2b/demo", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "Crie sua conta demo" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("demo-form")).toHaveAttribute("data-hydrated", "true", { timeout: 10_000 });
}

test.describe("Fluxo de conta demo", () => {
  test("exibe formulario com campos nome, email e senha", async ({ page }) => {
    await navigateToDemo(page);

    await expect(page.getByLabel("Nome")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByLabel("E-mail")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByLabel("Senha", { exact: true })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole("button", { name: "Criar conta demo gratuita" })).toBeVisible({ timeout: 5_000 });
  });

  test("valida nome vazio", async ({ page }) => {
    await navigateToDemo(page);

    await page.getByLabel("E-mail").fill("teste@email.com");
    await page.getByLabel("Senha", { exact: true }).fill("senha123");
    await page.getByRole("button", { name: "Criar conta demo gratuita" }).click();

    await expect(page.getByText("Informe seu nome.")).toBeVisible({ timeout: 5_000 });
  });

  test("valida email invalido", async ({ page }) => {
    await navigateToDemo(page);

    await page.getByLabel("Nome").fill("Tester");
    await page.getByLabel("E-mail").fill("email-invalido");
    await page.getByLabel("Senha", { exact: true }).fill("senha123");
    await page.getByRole("button", { name: "Criar conta demo gratuita" }).click();

    await expect(page.getByText("Informe um e-mail valido.")).toBeVisible({ timeout: 5_000 });
  });

  test("valida senha curta", async ({ page }) => {
    await navigateToDemo(page);

    await page.getByLabel("Nome").fill("Tester");
    await page.getByLabel("E-mail").fill("teste@email.com");
    await page.getByLabel("Senha", { exact: true }).fill("12345");
    await page.getByRole("button", { name: "Criar conta demo gratuita" }).click();

    await expect(page.getByText("A senha deve ter no minimo 6 caracteres.")).toBeVisible({ timeout: 5_000 });
  });

  test("submissao com dados validos redireciona para dashboard com demo=1", async ({ page }) => {
    test.slow();
    await mockDemoApi(page);
    await installDemoBootstrapMocks(page);
    await navigateToDemo(page);

    await page.getByLabel("Nome").fill("Tester Demo");
    await page.getByLabel("E-mail").fill("tester@demo.com");
    await page.getByLabel("Senha", { exact: true }).fill("senha123");
    await page.getByRole("button", { name: "Criar conta demo gratuita" }).click();

    await page.waitForURL(/\/dashboard\?demo=1/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/dashboard\?demo=1/);
  });

  test.skip("banner Conta Demonstracao visivel no dashboard apos criacao", async ({ page }) => {
    test.slow();
    await installDemoBootstrapMocks(page);
    await seedDemoSession(page);
    await page.goto("/dashboard?demo=1", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Conta Demonstracao")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Expira em 7 dias")).toBeVisible();
  });

  test.skip("dismiss do banner persiste na sessao", async ({ page }) => {
    test.slow();
    await installDemoBootstrapMocks(page);
    await seedDemoSession(page);
    await page.goto("/dashboard?demo=1", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Conta Demonstracao")).toBeVisible({ timeout: 10_000 });

    // Dismiss the banner
    await page.getByRole("button", { name: "Fechar banner" }).click();
    await expect(page.getByText("Conta Demonstracao")).not.toBeVisible();

    // Reload with same query param - banner should stay dismissed (sessionStorage)
    await page.goto("/dashboard?demo=1", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Conta Demonstracao")).not.toBeVisible();
  });
});
