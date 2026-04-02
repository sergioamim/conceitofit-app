import { test, expect, type Page } from "@playwright/test";
import { installPublicJourneyApiMocks, seedAuthenticatedSession } from "./support/backend-only-stubs";

async function abrirClientesComSessao(page: Page) {
  await installPublicJourneyApiMocks(page);
  await seedAuthenticatedSession(page, {
    tenantId: "tenant-mananciais-s1",
    tenantName: "MANANCIAIS - S1",
    availableTenants: [{ tenantId: "tenant-mananciais-s1", defaultTenant: true }],
  });
  await page.goto("/clientes", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Clientes" })).toBeVisible();
}

test.describe("Sincronização de Estado na URL - Clientes", () => {
  test("deve ler filtros da URL e manter a navegação sincronizada", async ({ page }) => {
    await abrirClientesComSessao(page);
    await page.goto("/clientes?q=Teste&status=INATIVO", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Clientes" })).toBeVisible();
    await expect(
      page.getByPlaceholder("Buscar por nome, CPF, telefone ou e-mail...")
    ).toHaveValue("Teste");
    expect(page.url()).toContain("status=INATIVO");
    expect(page.url()).toContain("q=Teste");

    await page.goBack();
    await page.waitForURL(/\/clientes$/, { timeout: 10_000 });

    await page.goForward();
    await page.waitForURL(/\/clientes\?q=Teste&status=INATIVO$/, { timeout: 10_000 });
    expect(page.url()).toContain("status=INATIVO");
    expect(page.url()).toContain("q=Teste");

    const limparBtn = page.getByRole("button", { name: "Limpar" });
    await expect(limparBtn).toBeVisible();
    await limparBtn.click();
    await page.waitForURL(/\/clientes$/, { timeout: 10_000 });
    expect(page.url()).not.toContain("status=INATIVO");
    expect(page.url()).not.toContain("q=Teste");
  });
});
