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

test.describe("Operacional grade e catraca", () => {
  test("abre telas migradas para API-only sem depender de mock runtime", async ({ page }) => {
    await abrirComSessaoMock(page);

    await page.goto("/grade");
    await expect(page.getByRole("heading", { name: "Grade" })).toBeVisible();
    await expect(page.getByText("Calendário semanal das atividades configuradas na Grade")).toBeVisible();

    await page.goto("/atividades");
    await expect(page.getByRole("heading", { name: "Atividades" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Nova Atividade" })).toBeVisible();

    await page.goto("/administrativo/atividades-grade");
    await expect(page.getByRole("heading", { name: "Atividades - Grade" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Nova Grade" })).toBeVisible();

    await page.goto("/administrativo/catraca-status");
    await expect(page.getByRole("heading", { name: "Status de conexões Catraca" })).toBeVisible();
    await expect(page.getByText("Total de agentes conectados")).toBeVisible();
  });
});
