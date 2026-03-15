import { expect, test, type Page } from "@playwright/test";

async function abrirComSessaoMock(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Usuário").fill("admin@academia.local");
  await page.getByLabel("Senha").fill("12345678");
  await page.getByRole("button", { name: "Entrar" }).click();

  const stepTenant = page.getByRole("heading", { name: "Unidade prioritária" });
  if (await stepTenant.isVisible()) {
    await page.getByRole("combobox").click();
    await page.getByRole("option").first().click();
    await page.getByRole("button", { name: "Salvar e continuar" }).click();
  }
}

async function abrirTab(page: Page, name: string) {
  const tab = page.getByRole("tab", { name });
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await tab.click();
    if ((await tab.getAttribute("data-state")) === "active") {
      return;
    }
    await page.waitForTimeout(250);
  }
  await expect(tab).toHaveAttribute("data-state", "active");
}

test.describe("CRM operacional", () => {
  test("navega pelo workspace e módulos operacionais do CRM", async ({ page }) => {
    await abrirComSessaoMock(page);

    await page.goto("/crm/prospects-kanban");
    await expect(page.getByRole("heading", { name: "CRM · Funil de Vendas" })).toBeVisible();
    await expect(page.getByRole("combobox").first()).toBeVisible();

    await page.goto("/crm/tarefas");
    await expect(page.getByRole("heading", { name: "Tarefas comerciais" })).toBeVisible();
    await expect(page.getByLabel("Título da tarefa")).toBeVisible();

    await page.goto("/crm/playbooks");
    await expect(page.getByRole("heading", { name: "Playbooks e cadências" })).toBeVisible();
    await abrirTab(page, "Cadências");

    const cadenciasUnavailable = page.getByText("Este ambiente ainda não expõe cadências CRM no backend");
    await expect(page.getByLabel("Nome da cadência")).toBeVisible();
    if (await cadenciasUnavailable.isVisible()) {
      await expect(cadenciasUnavailable).toBeVisible();
    }

    await page.goto("/crm");
    await expect(page.getByRole("heading", { name: "Workspace CRM" })).toBeVisible();
    await expect(page.getByText("Automações visíveis ao operador")).toBeVisible();
  });
});
