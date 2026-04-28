import { expect, test, type Page } from "@playwright/test";
import { installOperationalCrmApiMocks, seedAuthenticatedSession } from "./support/backend-only-stubs";

async function abrirComSessaoMock(page: Page) {
  await installOperationalCrmApiMocks(page);
  await seedAuthenticatedSession(page, {
    tenantId: "tenant-crm-operacional",
    tenantName: "MANANCIAIS - S1",
    availableTenants: [{ tenantId: "tenant-crm-operacional", defaultTenant: true }],
  });
  await navegarPara(page, "/crm");
  await expect(page.getByRole("heading", { name: "Workspace CRM" })).toBeVisible();
  await expect(page.getByText("Automações visíveis ao operador")).toBeVisible();
}

async function navegarPara(page: Page, path: string) {
  try {
    await page.goto(path, { waitUntil: "domcontentloaded" });
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("ERR_ABORTED")) {
      throw error;
    }
  }
  await page.waitForURL(new RegExp(path === "/crm" ? "/crm(?:\\?|$)" : path), { timeout: 30_000 });
}

async function aguardarLoaderSumir(page: Page, text: string) {
  const loader = page.getByText(text);
  if (await loader.isVisible().catch(() => false)) {
    await expect(loader).not.toBeVisible({ timeout: 30_000 });
  }
}

test.describe("CRM operacional", () => {
  test("navega pelo workspace e módulos operacionais do CRM", async ({ page }) => {
    test.slow();
    await abrirComSessaoMock(page);

    await navegarPara(page, "/crm/prospects-kanban");
    await aguardarLoaderSumir(page, "Carregando pipeline comercial...");
    await expect(page.getByRole("heading", { name: "CRM · Funil de Vendas" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("combobox").first()).toBeVisible();

    await navegarPara(page, "/crm/tarefas");
    await aguardarLoaderSumir(page, "Carregando tarefas comerciais...");
    await expect(page.getByRole("heading", { name: "Tarefas comerciais" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByLabel("Título da tarefa")).toBeVisible();

    await navegarPara(page, "/crm/playbooks");
    await aguardarLoaderSumir(page, "Carregando playbooks...");
    await expect(page.getByRole("heading", { name: "Playbooks e cadências" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Qualificação expressa")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("tab", { name: "Cadências" })).toBeVisible();
    await page.getByRole("tab", { name: "Cadências" }).click();
    await expect(page.getByText("Cadência D+2")).toBeVisible({ timeout: 30_000 });

    await navegarPara(page, "/crm");
    await expect(page.getByRole("heading", { name: "Workspace CRM" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Automações visíveis ao operador")).toBeVisible({ timeout: 30_000 });
  });
});
