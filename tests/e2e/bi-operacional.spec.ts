import { expect, test, type Page } from "@playwright/test";

async function openAuthenticatedPage(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Usuário").fill("admin@academia.local");
  await page.getByLabel("Senha").fill("12345678");
  await page.getByRole("button", { name: "Entrar" }).click();

  const unitStep = page.getByRole("heading", { name: "Unidade prioritária" });
  if (await unitStep.isVisible()) {
    await page.getByRole("combobox").click();
    await page.getByRole("option").first().click();
    await page.getByRole("button", { name: /Salvar e continuar/i }).click();
  }
}

test.describe("BI operacional e visão de rede", () => {
  test("navega entre visão unitária e rede com filtros gerenciais", async ({ page }) => {
    await openAuthenticatedPage(page);

    await page.goto("/gerencial/bi");
    await expect(page.getByRole("heading", { name: "BI Operacional" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Exportar CSV" })).toBeVisible();
    await expect(page.getByText("Benchmark por unidade")).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "MANANCIAIS - S1" })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "PECHINCHA - S3" })).toBeVisible();

    await page.getByLabel("Escopo BI").click();
    await page.getByRole("option", { name: "Academia / rede" }).click();
    await expect(page.getByLabel("Academia BI")).toContainText("Academia Sergio Amim");

    await page.getByRole("link", { name: "Abrir visão de rede" }).click();
    await expect(page.getByRole("heading", { name: "Visão de Rede" })).toBeVisible();
    await expect(page.getByText("Rede consolidada")).toBeVisible();
    await expect(page.getByText("Ranking da rede")).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "MANANCIAIS - S1" })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "PECHINCHA - S3" })).toBeVisible();

    await page.getByLabel("Unidade Rede").click();
    await page.getByRole("option", { name: "PECHINCHA - S3" }).click();
    await expect(page.getByLabel("Unidade Rede")).toContainText("PECHINCHA - S3");
    await expect(page.getByText("Unidade filtrada")).toBeVisible();

    await page.getByLabel("Segmento Rede").click();
    await page.getByRole("option", { name: "WhatsApp" }).click();
    await expect(page.getByText("Checklist de governança")).toBeVisible();
  });
});
