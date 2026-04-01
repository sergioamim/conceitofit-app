import { expect, test } from "@playwright/test";
import { installAdminCrudApiMocks, seedAuthenticatedSession } from "./support/backend-only-stubs";

test.describe("onboarding completo da academia", () => {
  test("provisiona academia, força troca de senha e conclui o checklist inicial", async ({ page }) => {
    await installAdminCrudApiMocks(page);
    await seedAuthenticatedSession(page, {
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

    await page.goto("/admin/onboarding/provisionar");
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

    await expect(page.getByText("Credenciais geradas")).toBeVisible();

    const adminEmail = await page.locator("#provision-credential-admin-email").inputValue();
    const temporaryPassword = await page.locator("#provision-credential-temporary-password").inputValue();

    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });

    await page.goto("/login?next=%2Fdashboard");

    await page.getByLabel("Usuário").fill(adminEmail);
    await page.getByLabel("Senha").fill(temporaryPassword);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/primeiro-acesso\/trocar-senha/);
    await expect(page.getByRole("heading", { name: "Defina sua nova senha" })).toBeVisible();

    await page.locator("#forced-password-new").fill("NovaSenha#123");
    await page.locator("#forced-password-confirm").fill("NovaSenha#123");
    const dashboardResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/academia/dashboard") &&
        response.request().method() === "GET",
    );
    const onboardingStatusResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/onboarding/status") &&
        response.request().method() === "GET",
    );
    await page.getByRole("button", { name: "Salvar nova senha" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await dashboardResponsePromise;
    await onboardingStatusResponsePromise;

    const checklist = page.getByTestId("onboarding-checklist");
    await expect(checklist).toBeVisible();
    await expect(checklist).toContainText("0 de 2 etapa(s) concluídas.");
    await expect(checklist).toContainText("Dados da Academia");
    await expect(checklist).toContainText("Criar Plano");

    await checklist.getByRole("link", { name: "Configurar agora" }).first().click();
    await expect(page).toHaveURL(/\/administrativo\/academia/);

    await page.getByRole("button", { name: "Salvar alteracoes" }).click();

    await page.goto("/dashboard");
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

    await page.goto("/dashboard");
    await expect(page.getByTestId("onboarding-checklist")).toHaveCount(0);
  });
});
