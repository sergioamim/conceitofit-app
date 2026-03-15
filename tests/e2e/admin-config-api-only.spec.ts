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

test.describe("Admin config API-only", () => {
  test("abre telas administrativas migradas sem runtime mock", async ({ page }) => {
    await abrirComSessaoMock(page);

    await page.goto("/administrativo/unidades");
    await expect(page.getByRole("heading", { name: "Unidades" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Nova unidade" })).toBeVisible();

    await page.goto("/administrativo/academia");
    await expect(page.getByRole("heading", { name: "Academia" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Salvar alteracoes" })).toBeVisible();

    await page.goto("/administrativo/ia");
    await expect(page.getByRole("heading", { name: "Integração com IA" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Atualizar" })).toBeVisible();

    await page.goto("/administrativo/conciliacao-bancaria");
    await expect(page.getByRole("heading", { name: "Conciliação bancária" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Importar linhas" })).toBeVisible();
  });
});
