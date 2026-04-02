import { expect, test, type Page } from "@playwright/test";
import { installAdminCrudApiMocks } from "./support/backend-only-stubs";
import { applyE2EAuthSession, clearE2EAuthSession } from "./support/auth-session";

async function gotoWithRetry(page: Page, url: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      return;
    } catch (error) {
      if (!(error instanceof Error) || !/ERR_ABORTED|ERR_CONNECTION_REFUSED|ERR_EMPTY_RESPONSE/i.test(error.message) || attempt === 2) {
        throw error;
      }
      await page.waitForTimeout(500);
    }
  }
}

type ProvisionResponse = {
  tenantId?: string;
  unidadePrincipalId?: string;
  emailAdministrador?: string;
  adminEmail?: string;
  email?: string;
  senhaTemporaria?: string;
  temporaryPassword?: string;
  password?: string;
};

type LoginResponse = {
  token?: string;
  refreshToken?: string;
  type?: string;
  expiresIn?: number;
  userId?: string;
  displayName?: string;
  activeTenantId?: string;
  availableTenants?: Array<{ tenantId?: string; defaultTenant?: boolean }>;
  availableScopes?: string[];
  broadAccess?: boolean;
  forcePasswordChange?: boolean;
};

test.describe("onboarding completo da academia", () => {
  test("provisiona academia, força troca de senha e conclui o checklist inicial", async ({ page }) => {
    await installAdminCrudApiMocks(page);
    await gotoWithRetry(page, "/admin-login");
    await applyE2EAuthSession(page, {
      tenantId: "tenant-centro",
      availableTenants: [
        { tenantId: "tenant-centro", defaultTenant: true },
        { tenantId: "tenant-barra", defaultTenant: false },
      ],
      userId: "user-admin-global",
      userKind: "COLABORADOR",
      displayName: "Sergio Amim",
      roles: ["OWNER", "ADMIN"],
      availableScopes: ["GLOBAL"],
      broadAccess: true,
    });

    await gotoWithRetry(page, "/admin/onboarding/provisionar");
    await expect(page.getByRole("heading", { name: "Provisionar nova academia" })).toBeVisible();

    await page.getByLabel("Nome da academia").fill("Academia QA Onboarding");
    await page.getByLabel("CNPJ").fill("11.444.777/0001-61");
    await page.getByLabel("Telefone").fill("(21) 99999-0000");
    await page.getByLabel("Nome da unidade principal").fill("Unidade QA Centro");
    await page.getByLabel("Nome do administrador").fill("Mariana QA");
    await page.getByLabel("E-mail do administrador").fill("mariana.qa@academia.local");
    const provisionResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/admin/onboarding/provision") &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Provisionar academia" }).click();
    const provisionResponse = await provisionResponsePromise;

    expect(provisionResponse.status()).toBe(201);
    const provisionPayload = (await provisionResponse.json()) as ProvisionResponse;

    await expect(page.getByText("Credenciais geradas")).toBeVisible();

    const adminEmail =
      provisionPayload.emailAdministrador ??
      provisionPayload.adminEmail ??
      provisionPayload.email ??
      "mariana.qa@academia.local";
    const temporaryPassword =
      provisionPayload.senhaTemporaria ??
      provisionPayload.temporaryPassword ??
      provisionPayload.password ??
      "";

    expect(adminEmail).toBeTruthy();
    expect(temporaryPassword).toBeTruthy();

    await page.evaluate(() => {
      window.sessionStorage.clear();
    });
    await clearE2EAuthSession(page);
    const loginResult = await page.evaluate(async ({ email, password }) => {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });
      const body = await response.json().catch(() => null);
      return {
        status: response.status,
        body,
      };
    }, {
      email: adminEmail,
      password: temporaryPassword,
    });

    expect(loginResult.status).toBe(200);
    const loginPayload = (loginResult.body ?? {}) as LoginResponse;
    const provisionedTenantId =
      loginPayload.activeTenantId
      ?? provisionPayload.tenantId
      ?? provisionPayload.unidadePrincipalId
      ?? "tenant-centro";
    await applyE2EAuthSession(page, {
      token: loginPayload.token ?? `token-onboarding-${provisionedTenantId}`,
      refreshToken: loginPayload.refreshToken ?? `refresh-onboarding-${provisionedTenantId}`,
      type: loginPayload.type ?? "Bearer",
      expiresIn: loginPayload.expiresIn ?? 3600,
      userId: loginPayload.userId ?? `user-${provisionedTenantId}`,
      userKind: "COLABORADOR",
      displayName: loginPayload.displayName ?? "Mariana QA",
      activeTenantId: provisionedTenantId,
      preferredTenantId: provisionedTenantId,
      baseTenantId: provisionedTenantId,
      availableTenants: loginPayload.availableTenants?.length
        ? loginPayload.availableTenants.map((item) => ({
          tenantId: item.tenantId ?? provisionedTenantId,
          defaultTenant: item.defaultTenant,
        }))
        : [{ tenantId: provisionedTenantId, defaultTenant: true }],
      availableScopes: loginPayload.availableScopes ?? ["UNIDADE"],
      broadAccess: loginPayload.broadAccess ?? false,
      forcePasswordChangeRequired: loginPayload.forcePasswordChange ?? true,
    });

    await gotoWithRetry(page, "/primeiro-acesso/trocar-senha?next=%2Fdashboard");
    await expect(page.getByRole("heading", { name: "Defina sua nova senha" })).toBeVisible();
    await page.locator("#forced-password-new").fill("NovaSenha#123");
    await page.locator("#forced-password-confirm").fill("NovaSenha#123");
    await page.getByRole("button", { name: "Salvar nova senha" }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.waitForLoadState("domcontentloaded");

    const checklist = page.getByTestId("onboarding-checklist");
    await expect(checklist).toBeVisible();
    await expect(checklist).toContainText("0 de 2 etapa(s) concluídas.");
    await expect(checklist).toContainText("Dados da Academia");
    await expect(checklist).toContainText("Criar Plano");

    await checklist.getByRole("link", { name: "Configurar agora" }).first().click();
    await expect(page).toHaveURL(/\/administrativo\/academia/);

    await page.getByRole("button", { name: /Salvar altera(c|ç)oes/i }).click();

    await gotoWithRetry(page, "/dashboard");
    await expect(checklist).toBeVisible();
    await expect(checklist).toContainText("1 de 2 etapa(s) concluídas.");

    await checklist.getByRole("link", { name: "Configurar agora" }).click();
    await expect(page).toHaveURL(/\/planos\/novo/);
    await expect(page.getByRole("heading", { name: "Novo plano" })).toBeVisible();

    const tenantId = await page.evaluate(() => window.localStorage.getItem("academia-auth-active-tenant-id"));
    expect(tenantId).toBeTruthy();

    const createPlanoStatus = await page.evaluate(async ({ activeTenantId }) => {
      const response = await fetch(`/api/v1/comercial/planos?tenantId=${activeTenantId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: "Plano Start QA",
          tipo: "MENSAL",
          duracaoDias: 30,
          valor: 149.9,
          valorMatricula: 0,
        }),
      });

      return response.status;
    }, { activeTenantId: tenantId });

    expect(createPlanoStatus).toBe(201);

    await gotoWithRetry(page, "/dashboard");
    await expect(page.getByTestId("onboarding-checklist")).toHaveCount(0);
  });
});
