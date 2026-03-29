import { expect, test, type Page } from "@playwright/test";

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
  return page.addInitScript(() => {
    window.localStorage.setItem("academia-auth-token", "token-billing-e2e");
    window.localStorage.setItem("academia-auth-refresh-token", "refresh-billing-e2e");
    window.localStorage.setItem("academia-auth-token-type", "Bearer");
    window.localStorage.setItem("academia-auth-active-tenant-id", "tenant-centro");
    window.localStorage.setItem("academia-auth-preferred-tenant-id", "tenant-centro");
    window.localStorage.setItem(
      "academia-auth-available-tenants",
      JSON.stringify([{ tenantId: "tenant-centro", defaultTenant: true }]),
    );
  });
}

function seedSessionNoPermission(page: Page) {
  return page.addInitScript(() => {
    window.localStorage.setItem("academia-auth-token", "token-billing-viewer");
    window.localStorage.setItem("academia-auth-refresh-token", "refresh-billing-viewer");
    window.localStorage.setItem("academia-auth-token-type", "Bearer");
    window.localStorage.setItem("academia-auth-active-tenant-id", "tenant-centro");
    window.localStorage.setItem("academia-auth-preferred-tenant-id", "tenant-centro");
    window.localStorage.setItem(
      "academia-auth-available-tenants",
      JSON.stringify([{ tenantId: "tenant-centro", defaultTenant: true }]),
    );
  });
}

function normalizedPath(path: string) {
  return path.replace(/^\/backend/, "");
}

async function setupMocks(
  page: Page,
  state: { config: BillingConfigSeed },
  options?: { elevated?: boolean },
) {
  const elevated = options?.elevated ?? true;

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = normalizedPath(url.pathname);
    const method = request.method();

    // Auth
    if (path === "/api/v1/auth/me" && method === "GET") {
      await route.fulfill({
        status: 200,
        json: {
          id: "user-billing",
          nome: elevated ? "Admin Billing" : "Viewer Billing",
          email: "billing@qa.local",
          roles: elevated ? ["ADMIN"] : ["VIEWER"],
          activeTenantId: "tenant-centro",
          availableTenants: [{ tenantId: "tenant-centro", defaultTenant: true }],
          capabilities: { canAccessElevatedModules: elevated },
        },
      });
      return;
    }

    // Context
    if (path.startsWith("/api/v1/context/") && method === "GET") {
      await route.fulfill({ status: 200, json: { tenantId: "tenant-centro" } });
      return;
    }
    if (path.startsWith("/api/v1/context/") && method === "PUT") {
      await route.fulfill({ status: 200, json: {} });
      return;
    }

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

    // Tenant/academia endpoints (sidebar, layout)
    if (path === "/api/v1/academia" && method === "GET") {
      await route.fulfill({
        status: 200,
        json: { id: "acad-1", nome: "Academia Teste" },
      });
      return;
    }

    // Health
    if (path.includes("/actuator/health")) {
      await route.fulfill({ status: 200, json: { status: "UP" } });
      return;
    }

    // Fallback
    await route.fulfill({ status: 200, json: {} });
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("Billing Config Page", () => {
  test("renders page with config data", async ({ page }) => {
    const state = { config: defaultConfig() };
    await seedSession(page);
    await setupMocks(page, state);

    await page.goto("/administrativo/billing");

    await expect(page.getByRole("heading", { name: /cobrança recorrente/i })).toBeVisible();
    await expect(page.getByText("Asaas")).toBeVisible();
    await expect(page.getByText("Sandbox")).toBeVisible();
    await expect(page.getByText("Online")).toBeVisible();
  });

  test("shows status cards correctly", async ({ page }) => {
    const state = { config: { ...defaultConfig(), statusConexao: "OFFLINE" as const } };
    await seedSession(page);
    await setupMocks(page, state);

    await page.goto("/administrativo/billing");

    await expect(page.getByText("Offline")).toBeVisible();
    await expect(page.getByText("Asaas")).toBeVisible();
  });

  test("shows webhook URL with tenant ID", async ({ page }) => {
    const state = { config: defaultConfig() };
    await seedSession(page);
    await setupMocks(page, state);

    await page.goto("/administrativo/billing");

    await expect(page.getByText(/\/api\/webhooks\/billing\/tenant-centro/)).toBeVisible();
  });

  test("toggle API key visibility", async ({ page }) => {
    const state = { config: defaultConfig() };
    await seedSession(page);
    await setupMocks(page, state);

    await page.goto("/administrativo/billing");

    // Key should be masked initially
    await expect(page.getByText(/sk_t.*789/)).toBeHidden();

    // Click Exibir
    await page.getByText("Exibir").click();

    // Now the input should be visible with the key
    const input = page.locator('input[name="chaveApi"]');
    await expect(input).toBeVisible();
  });

  test("test connection button works", async ({ page }) => {
    const state = { config: defaultConfig() };
    await seedSession(page);
    await setupMocks(page, state);

    await page.goto("/administrativo/billing");

    await page.getByRole("button", { name: /testar conexão/i }).click();

    // Should show success toast
    await expect(page.getByText(/conexão ok/i)).toBeVisible();
  });

  test("save configuration updates state", async ({ page }) => {
    const state = { config: defaultConfig() };
    await seedSession(page);
    await setupMocks(page, state);

    await page.goto("/administrativo/billing");

    // Click Exibir to show the input
    await page.getByText("Exibir").click();

    // Change API key
    const keyInput = page.locator('input[name="chaveApi"]');
    await keyInput.clear();
    await keyInput.fill("sk_live_new_key_12345678");

    // Enable auto-renewal
    await page.getByText(/ativar cobrança recorrente automática/i).click();

    // Save
    await page.getByRole("button", { name: /salvar configuração/i }).click();

    // Should show success toast
    await expect(page.getByText(/configuração salva/i)).toBeVisible();

    // Verify state was updated
    expect(state.config.chaveApi).toBe("sk_live_new_key_12345678");
    expect(state.config.ativo).toBe(true);
  });

  test("discard changes resets form", async ({ page }) => {
    const state = { config: defaultConfig() };
    await seedSession(page);
    await setupMocks(page, state);

    await page.goto("/administrativo/billing");

    // Show key and modify
    await page.getByText("Exibir").click();
    const keyInput = page.locator('input[name="chaveApi"]');
    await keyInput.clear();
    await keyInput.fill("temporary_key");

    // Discard
    await page.getByRole("button", { name: /descartar alterações/i }).click();

    // Show key again and verify reset
    await page.getByText("Exibir").click();
    const resetInput = page.locator('input[name="chaveApi"]');
    await expect(resetInput).toHaveValue("sk_test_abc123xyz789");
  });

  test("shows access denied for users without elevated permissions", async ({ page }) => {
    const state = { config: defaultConfig() };
    await seedSessionNoPermission(page);
    await setupMocks(page, state, { elevated: false });

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
    await seedSession(page);
    await setupMocks(page, state);

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
    await seedSession(page);
    await setupMocks(page, state);

    await page.goto("/administrativo/billing");

    await page.getByRole("button", { name: /copiar/i }).click();

    // Should show toast
    await expect(page.getByText(/url copiada/i)).toBeVisible();
  });

  test("shows last test timestamp when available", async ({ page }) => {
    const state = { config: defaultConfig() };
    await seedSession(page);
    await setupMocks(page, state);

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
    await seedSession(page);
    await setupMocks(page, state);

    await page.goto("/administrativo/billing");

    await expect(page.getByText(/não configurado/i)).toBeVisible();
  });
});
