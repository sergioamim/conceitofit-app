import { expect, test, type Page } from "@playwright/test";

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
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/backend/, "");

    if (path === "/api/v1/app/bootstrap" && method === "GET") {
      await route.fulfill({
        status: 200,
        json: {
          user: {
            id: DEMO_RESPONSE.userId,
            userId: DEMO_RESPONSE.userId,
            nome: DEMO_RESPONSE.displayName,
            displayName: DEMO_RESPONSE.displayName,
            email: "demo@conceito.fit",
            roles: ["ADMIN"],
            userKind: DEMO_RESPONSE.userKind,
            redeId: DEMO_RESPONSE.redeId,
            redeSubdominio: DEMO_RESPONSE.redeSubdominio,
            redeSlug: DEMO_RESPONSE.redeSlug,
            redeNome: DEMO_RESPONSE.redeNome,
            activeTenantId: DEMO_RESPONSE.activeTenantId,
            tenantBaseId: DEMO_RESPONSE.tenantBaseId,
            availableTenants: DEMO_RESPONSE.availableTenants,
            availableScopes: DEMO_RESPONSE.availableScopes,
            broadAccess: DEMO_RESPONSE.broadAccess,
          },
          tenantContext: {
            currentTenantId: DEMO_TENANT.id,
            tenantAtual: DEMO_TENANT,
            unidadesDisponiveis: [DEMO_TENANT],
          },
          academia: DEMO_ACADEMIA,
          branding: null,
          capabilities: {
            canAccessElevatedModules: false,
            canDeleteClient: false,
          },
        },
      });
      return;
    }

    if (path === "/api/v1/context/unidade-ativa" && method === "GET") {
      await route.fulfill({
        status: 200,
        json: {
          currentTenantId: DEMO_TENANT.id,
          tenantAtual: DEMO_TENANT,
          unidadesDisponiveis: [DEMO_TENANT],
        },
      });
      return;
    }

    if (path === `/api/v1/context/unidade-ativa/${DEMO_TENANT.id}` && method === "PUT") {
      await route.fulfill({
        status: 200,
        json: {
          currentTenantId: DEMO_TENANT.id,
          tenantAtual: DEMO_TENANT,
          unidadesDisponiveis: [DEMO_TENANT],
        },
      });
      return;
    }

    if (path === "/api/v1/auth/me" && method === "GET") {
      await route.fulfill({
        status: 200,
        json: {
          id: DEMO_RESPONSE.userId,
          userId: DEMO_RESPONSE.userId,
          nome: DEMO_RESPONSE.displayName,
          displayName: DEMO_RESPONSE.displayName,
          email: "demo@conceito.fit",
          roles: ["ADMIN"],
          userKind: DEMO_RESPONSE.userKind,
          redeId: DEMO_RESPONSE.redeId,
          redeSubdominio: DEMO_RESPONSE.redeSubdominio,
          redeSlug: DEMO_RESPONSE.redeSlug,
          redeNome: DEMO_RESPONSE.redeNome,
          activeTenantId: DEMO_RESPONSE.activeTenantId,
          tenantBaseId: DEMO_RESPONSE.tenantBaseId,
          availableTenants: DEMO_RESPONSE.availableTenants,
          availableScopes: DEMO_RESPONSE.availableScopes,
          broadAccess: DEMO_RESPONSE.broadAccess,
        },
      });
      return;
    }

    if (path === "/api/v1/academia" && method === "GET") {
      await route.fulfill({
        status: 200,
        json: DEMO_ACADEMIA,
      });
      return;
    }

    if (path === "/api/v1/academia/dashboard" && method === "GET") {
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
}

async function navigateToDemo(page: Page) {
  await page.goto("/b2b/demo", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Crie sua conta demo" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("demo-form")).toHaveAttribute("data-hydrated", "true");
}

test.describe("Fluxo de conta demo", () => {
  test("exibe formulario com campos nome, email e senha", async ({ page }) => {
    await navigateToDemo(page);

    await expect(page.getByLabel("Nome")).toBeVisible();
    await expect(page.getByLabel("E-mail")).toBeVisible();
    await expect(page.getByLabel("Senha", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Criar conta demo gratuita" })).toBeVisible();
  });

  test("valida nome vazio", async ({ page }) => {
    await navigateToDemo(page);

    await page.getByLabel("E-mail").fill("teste@email.com");
    await page.getByLabel("Senha", { exact: true }).fill("senha123");
    await page.getByRole("button", { name: "Criar conta demo gratuita" }).click();

    await expect(page.getByText("Informe seu nome.")).toBeVisible();
  });

  test("valida email invalido", async ({ page }) => {
    await navigateToDemo(page);

    await page.getByLabel("Nome").fill("Tester");
    await page.getByLabel("E-mail").fill("email-invalido");
    await page.getByLabel("Senha", { exact: true }).fill("senha123");
    await page.getByRole("button", { name: "Criar conta demo gratuita" }).click();

    await expect(page.getByText("Informe um e-mail valido.")).toBeVisible();
  });

  test("valida senha curta", async ({ page }) => {
    await navigateToDemo(page);

    await page.getByLabel("Nome").fill("Tester");
    await page.getByLabel("E-mail").fill("teste@email.com");
    await page.getByLabel("Senha", { exact: true }).fill("12345");
    await page.getByRole("button", { name: "Criar conta demo gratuita" }).click();

    await expect(page.getByText("A senha deve ter no minimo 6 caracteres.")).toBeVisible();
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

    await page.waitForURL("**/dashboard?demo=1", { timeout: 15_000 });
    await expect(page).toHaveURL(/\/dashboard\?demo=1/);
  });

  test("banner Conta Demonstracao visivel no dashboard apos criacao", async ({ page }) => {
    test.slow();
    await mockDemoApi(page);
    await installDemoBootstrapMocks(page);
    await navigateToDemo(page);

    await page.getByLabel("Nome").fill("Tester Demo");
    await page.getByLabel("E-mail").fill("tester@demo.com");
    await page.getByLabel("Senha", { exact: true }).fill("senha123");
    await page.getByRole("button", { name: "Criar conta demo gratuita" }).click();

    await page.waitForURL("**/dashboard?demo=1", { timeout: 15_000 });
    await expect(page.getByText("Conta Demonstracao")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Expira em 7 dias")).toBeVisible();
  });

  test("dismiss do banner persiste na sessao", async ({ page }) => {
    test.slow();
    await mockDemoApi(page);
    await installDemoBootstrapMocks(page);
    await navigateToDemo(page);

    await page.getByLabel("Nome").fill("Tester Demo");
    await page.getByLabel("E-mail").fill("tester@demo.com");
    await page.getByLabel("Senha", { exact: true }).fill("senha123");
    await page.getByRole("button", { name: "Criar conta demo gratuita" }).click();

    await page.waitForURL("**/dashboard?demo=1", { timeout: 15_000 });
    await expect(page.getByText("Conta Demonstracao")).toBeVisible({ timeout: 10_000 });

    // Dismiss the banner
    await page.getByRole("button", { name: "Fechar banner" }).click();
    await expect(page.getByText("Conta Demonstracao")).not.toBeVisible();

    // Reload with same query param - banner should stay dismissed (sessionStorage)
    await page.goto("/dashboard?demo=1", { waitUntil: "domcontentloaded" });
    // Give time for the banner component to mount
    await page.waitForTimeout(2_000);
    await expect(page.getByText("Conta Demonstracao")).not.toBeVisible();
  });
});
