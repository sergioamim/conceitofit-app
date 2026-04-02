import { expect, test, type Page } from "@playwright/test";
import { installE2EAuthSession, type ResolvedE2EAuthSession } from "./support/auth-session";
import { installOperationalAppShellMocks } from "./support/protected-shell-mocks";

// ---------------------------------------------------------------------------
// Seed state
// ---------------------------------------------------------------------------

type BillingConfigSeed = {
  provedorAtivo: string;
  chaveApi: string;
  ambiente: "SANDBOX" | "PRODUCAO";
  ativo: boolean;
  statusConexao: "ONLINE" | "OFFLINE" | "NAO_CONFIGURADO";
  ultimoTesteEm?: string;
};

function defaultConfig(): BillingConfigSeed {
  return {
    provedorAtivo: "ASAAS",
    chaveApi: "sk_test_abc123xyz789",
    ambiente: "SANDBOX",
    ativo: false,
    statusConexao: "ONLINE",
    ultimoTesteEm: "2026-03-28T14:30:00",
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function seedSession(page: Page) {
  return installE2EAuthSession(page, {
    activeTenantId: "tenant-centro",
    baseTenantId: "tenant-centro",
    availableTenants: [{ tenantId: "tenant-centro", defaultTenant: true }],
    userId: "user-billing",
    userKind: "COLABORADOR",
    displayName: "Admin Billing",
    roles: ["ADMIN"],
    availableScopes: ["UNIDADE"],
  });
}

function seedSessionNoPermission(page: Page) {
  return installE2EAuthSession(page, {
    activeTenantId: "tenant-centro",
    baseTenantId: "tenant-centro",
    availableTenants: [{ tenantId: "tenant-centro", defaultTenant: true }],
    userId: "user-billing-viewer",
    userKind: "COLABORADOR",
    displayName: "Viewer Billing",
    roles: ["VIEWER"],
    availableScopes: ["UNIDADE"],
  });
}

function normalizedPath(path: string) {
  return path.replace(/^\/backend/, "");
}

function captureConsoleMessages(page: Page) {
  const messages: string[] = [];
  page.on("console", (message) => {
    messages.push(message.text());
  });
  return messages;
}

async function setupMocks(
  page: Page,
  state: { config: BillingConfigSeed },
  options?: { elevated?: boolean; session?: ResolvedE2EAuthSession },
) {
  const elevated = options?.elevated ?? true;

  await page.context().addCookies([
    { name: "academia-active-tenant-id", value: "tenant-centro", domain: "localhost", path: "/" },
    { name: "academia-active-tenant-name", value: "Unidade Centro", domain: "localhost", path: "/" },
  ]);

  await installOperationalAppShellMocks(page, {
    currentTenantId: "tenant-centro",
    tenants: [
      {
        id: "tenant-centro",
        academiaId: "acad-1",
        groupId: "acad-1",
        nome: "Unidade Centro",
        ativo: true,
      },
    ],
    user: {
      id: elevated ? "user-billing" : "user-billing-viewer",
      userId: elevated ? "user-billing" : "user-billing-viewer",
      nome: elevated ? "Admin Billing" : "Viewer Billing",
      displayName: elevated ? "Admin Billing" : "Viewer Billing",
      email: "billing@qa.local",
      roles: elevated ? ["ADMIN"] : ["VIEWER"],
      userKind: "COLABORADOR",
      activeTenantId: "tenant-centro",
      tenantBaseId: "tenant-centro",
      availableScopes: ["UNIDADE"],
      broadAccess: false,
    },
    academia: { id: "acad-1", nome: "Academia Teste", ativo: true },
    capabilities: {
      canAccessElevatedModules: elevated,
      canDeleteClient: false,
    },
    refreshSession: options?.session
      ? {
          token: options.session.token,
          refreshToken: options.session.refreshToken,
          type: options.session.type,
        }
      : undefined,
  });

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = normalizedPath(url.pathname);
    const method = request.method();

    // Billing config GET
    if (path === "/api/v1/billing/config" && method === "GET") {
      await route.fulfill({ status: 200, json: state.config });
      return;
    }

    // Billing config PUT (save)
    if (path === "/api/v1/billing/config" && method === "PUT") {
      const body = JSON.parse(await request.postData() ?? "{}");
      state.config = { ...state.config, ...body };
      await route.fulfill({ status: 200, json: state.config });
      return;
    }

    // Billing test connection
    if (path === "/api/v1/billing/config/test" && method === "POST") {
      await route.fulfill({
        status: 200,
        json: { success: true, message: "Gateway respondeu com sucesso." },
      });
      return;
    }

    // Health
    if (path.includes("/actuator/health")) {
      await route.fulfill({ status: 200, json: { status: "UP" } });
      return;
    }

    await route.fallback();
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("Billing Config Page", () => {
  test("renders page with config data", async ({ page }) => {
    const state = { config: defaultConfig() };
    const session = await seedSession(page);
    await setupMocks(page, state, { session });

    await page.goto("/administrativo/billing");

    const statusCard = page.locator("div").filter({ hasText: /Status da conexão/ }).first();
    const providerCard = page.locator("div").filter({ hasText: /Provedor ativo/ }).first();
    const environmentCard = page.locator("div").filter({ hasText: /Ambiente/ }).first();

    await expect(page.getByRole("heading", { name: /cobrança recorrente/i })).toBeVisible();
    await expect(statusCard).toContainText("Online");
    await expect(providerCard).toContainText("Asaas");
    await expect(environmentCard).toContainText("Sandbox");
  });

  test("shows status cards correctly", async ({ page }) => {
    const state = { config: { ...defaultConfig(), statusConexao: "OFFLINE" as const } };
    const session = await seedSession(page);
    await setupMocks(page, state, { session });

    await page.goto("/administrativo/billing");

    await expect(page.locator("div").filter({ hasText: /Status da conexão/ }).first()).toContainText("Offline");
    await expect(page.locator("div").filter({ hasText: /Provedor ativo/ }).first()).toContainText("Asaas");
  });

  test("shows webhook URL with tenant ID", async ({ page }) => {
    const state = { config: defaultConfig() };
    const session = await seedSession(page);
    await setupMocks(page, state, { session });

    await page.goto("/administrativo/billing");

    await expect(page.locator("code").filter({ hasText: "/api/webhooks/billing/tenant-centro" })).toBeVisible();
  });

  test("toggle API key visibility", async ({ page }) => {
    const state = { config: defaultConfig() };
    const session = await seedSession(page);
    await setupMocks(page, state, { session });

    await page.goto("/administrativo/billing");

    const keyInput = page.locator('input[name="chaveApi"]');
    await expect(keyInput).toBeHidden();
    await expect(page.locator("code").filter({ hasText: /^sk_t.*789$/ })).toBeVisible();

    await page.getByRole("button", { name: "Exibir" }).click();

    await expect(keyInput).toBeVisible();
    await expect(keyInput).toHaveValue("sk_test_abc123xyz789");
  });

  test("test connection button works", async ({ page }) => {
    const state = { config: defaultConfig() };
    const messages = captureConsoleMessages(page);
    const session = await seedSession(page);
    await setupMocks(page, state, { session });

    await page.goto("/administrativo/billing");

    await page.getByRole("button", { name: /testar conexão/i }).click();
    await expect.poll(() => messages.some((message) => message.includes("Conexão OK — Gateway respondeu com sucesso."))).toBe(true);
  });

  test("save configuration updates state", async ({ page }) => {
    const state = { config: defaultConfig() };
    const messages = captureConsoleMessages(page);
    const session = await seedSession(page);
    await setupMocks(page, state, { session });

    await page.goto("/administrativo/billing");

    await page.getByRole("button", { name: "Exibir" }).click();

    const keyInput = page.locator('input[name="chaveApi"]');
    await keyInput.clear();
    await keyInput.fill("sk_live_new_key_12345678");

    await page.getByLabel("Ativar cobrança recorrente automática").check();

    await page.getByRole("button", { name: /salvar configuração/i }).click();
    await expect.poll(() => messages.some((message) => message.includes("Configuração salva — Provedor Asaas configurado."))).toBe(true);

    expect(state.config.chaveApi).toBe("sk_live_new_key_12345678");
    expect(state.config.ativo).toBe(true);
  });

  test("discard changes resets form", async ({ page }) => {
    const state = { config: defaultConfig() };
    const session = await seedSession(page);
    await setupMocks(page, state, { session });

    await page.goto("/administrativo/billing");

    await page.getByRole("button", { name: "Exibir" }).click();
    const keyInput = page.locator('input[name="chaveApi"]');
    await keyInput.clear();
    await keyInput.fill("temporary_key");

    await page.getByRole("button", { name: /descartar alterações/i }).click();
    await expect(keyInput).toHaveValue("sk_test_abc123xyz789");
  });

  test("shows access denied for users without elevated permissions", async ({ page }) => {
    const state = { config: defaultConfig() };
    const session = await seedSessionNoPermission(page);
    await setupMocks(page, state, { elevated: false, session });

    await page.goto("/administrativo/billing");

    await expect(
      page.getByText(/apenas usuários com permissão elevada/i),
    ).toBeVisible();

    // Save button should be disabled
    const saveBtn = page.getByRole("button", { name: /salvar configuração/i });
    await expect(saveBtn).toBeDisabled();
  });

  test("auto-renewal checkbox toggles correctly", async ({ page }) => {
    const state = { config: defaultConfig() };
    const session = await seedSession(page);
    await setupMocks(page, state, { session });

    await page.goto("/administrativo/billing");

    const checkbox = page.getByRole("checkbox");
    await expect(checkbox).not.toBeChecked();

    await checkbox.check();
    await expect(checkbox).toBeChecked();

    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
  });

  test("copy webhook URL button works", async ({ page }) => {
    const state = { config: defaultConfig() };
    const messages = captureConsoleMessages(page);
    const session = await seedSession(page);
    await setupMocks(page, state, { session });

    await page.goto("/administrativo/billing");

    await page.getByRole("button", { name: /copiar/i }).click();
    await expect.poll(() => messages.some((message) => message.includes("URL copiada"))).toBe(true);
  });

  test("shows last test timestamp when available", async ({ page }) => {
    const state = { config: defaultConfig() };
    const session = await seedSession(page);
    await setupMocks(page, state, { session });

    await page.goto("/administrativo/billing");

    await expect(page.getByText(/último teste de conexão/i)).toBeVisible();
  });

  test("shows not configured status when no config", async ({ page }) => {
    const state = {
      config: {
        ...defaultConfig(),
        statusConexao: "NAO_CONFIGURADO" as const,
        chaveApi: "",
        provedorAtivo: "",
      },
    };
    const session = await seedSession(page);
    await setupMocks(page, state, { session });

    await page.goto("/administrativo/billing");

    await expect(page.getByText(/não configurado/i)).toBeVisible();
  });
});
