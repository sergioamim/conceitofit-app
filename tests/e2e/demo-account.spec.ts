import { expect, test, type Page } from "@playwright/test";

const DEMO_API_PATTERN = "**/api/v1/publico/demo";

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

async function navigateToDemo(page: Page) {
  await page.goto("/b2b/demo", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Crie sua conta demo" })).toBeVisible({ timeout: 15_000 });
}

test.describe("Fluxo de conta demo", () => {
  test("exibe formulario com campos nome, email e senha", async ({ page }) => {
    await navigateToDemo(page);

    await expect(page.getByLabel("Nome")).toBeVisible();
    await expect(page.getByLabel("E-mail")).toBeVisible();
    await expect(page.getByLabel("Senha")).toBeVisible();
    await expect(page.getByRole("button", { name: "Criar conta demo gratuita" })).toBeVisible();
  });

  test("valida nome vazio", async ({ page }) => {
    await navigateToDemo(page);

    await page.getByLabel("E-mail").fill("teste@email.com");
    await page.getByLabel("Senha").fill("senha123");
    await page.getByRole("button", { name: "Criar conta demo gratuita" }).click();

    await expect(page.getByText("Informe seu nome.")).toBeVisible();
  });

  test("valida email invalido", async ({ page }) => {
    await navigateToDemo(page);

    await page.getByLabel("Nome").fill("Tester");
    await page.getByLabel("E-mail").fill("email-invalido");
    await page.getByLabel("Senha").fill("senha123");
    await page.getByRole("button", { name: "Criar conta demo gratuita" }).click();

    await expect(page.getByText("Informe um e-mail valido.")).toBeVisible();
  });

  test("valida senha curta", async ({ page }) => {
    await navigateToDemo(page);

    await page.getByLabel("Nome").fill("Tester");
    await page.getByLabel("E-mail").fill("teste@email.com");
    await page.getByLabel("Senha").fill("12345");
    await page.getByRole("button", { name: "Criar conta demo gratuita" }).click();

    await expect(page.getByText("A senha deve ter no minimo 6 caracteres.")).toBeVisible();
  });

  test("submissao com dados validos redireciona para dashboard com demo=1", async ({ page }) => {
    test.slow();
    await mockDemoApi(page);
    await navigateToDemo(page);

    await page.getByLabel("Nome").fill("Tester Demo");
    await page.getByLabel("E-mail").fill("tester@demo.com");
    await page.getByLabel("Senha").fill("senha123");
    await page.getByRole("button", { name: "Criar conta demo gratuita" }).click();

    await page.waitForURL("**/dashboard?demo=1", { timeout: 15_000 });
    await expect(page).toHaveURL(/\/dashboard\?demo=1/);
  });

  test("banner Conta Demonstracao visivel no dashboard apos criacao", async ({ page }) => {
    test.slow();
    await mockDemoApi(page);
    await navigateToDemo(page);

    await page.getByLabel("Nome").fill("Tester Demo");
    await page.getByLabel("E-mail").fill("tester@demo.com");
    await page.getByLabel("Senha").fill("senha123");
    await page.getByRole("button", { name: "Criar conta demo gratuita" }).click();

    await page.waitForURL("**/dashboard?demo=1", { timeout: 15_000 });
    await expect(page.getByText("Conta Demonstracao")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Expira em 7 dias")).toBeVisible();
  });

  test("dismiss do banner persiste na sessao", async ({ page }) => {
    test.slow();
    await mockDemoApi(page);
    await navigateToDemo(page);

    await page.getByLabel("Nome").fill("Tester Demo");
    await page.getByLabel("E-mail").fill("tester@demo.com");
    await page.getByLabel("Senha").fill("senha123");
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
