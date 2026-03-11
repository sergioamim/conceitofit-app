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

test.describe("Reservas e operação de aulas", () => {
  test("cria waitlist, cancela reserva, promove fila e registra check-in", async ({ page }) => {
    await abrirComSessaoMock(page);

    await page.goto("/reservas");
    await expect(page.getByRole("heading", { name: "Reservas, vagas e aulas" })).toBeVisible();

    const sessaoLotada = page
      .getByRole("button")
      .filter({ hasText: "Spinning" })
      .filter({ hasText: "2 em espera" })
      .first();

    await expect(sessaoLotada).toBeVisible();
    await sessaoLotada.click();

    await page.getByLabel("Reservar para aluno").selectOption("al-demo-025");
    await page.getByRole("button", { name: "Reservar vaga" }).click();
    await expect(page.getByText("Aluno incluído na lista de espera.")).toBeVisible();
    await expect(page.locator("p.font-semibold", { hasText: "Camila Almeida 25" })).toBeVisible();
    await expect(page.getByText("Posição 3")).toBeVisible();

    const biancaRow = page
      .locator("p.font-semibold", { hasText: "Bianca Rocha" })
      .locator("xpath=ancestor::div[contains(@class,'rounded-xl')][1]");
    await biancaRow.getByRole("button", { name: "Cancelar" }).click();
    await expect(page.getByText("Reserva cancelada.")).toBeVisible();

    await page.getByRole("button", { name: "Promover waitlist" }).click();
    await expect(page.getByText("Primeira reserva da waitlist promovida.")).toBeVisible();

    const rafaelRow = page
      .locator("p.font-semibold", { hasText: "Rafael Rodrigues 4" })
      .locator("xpath=ancestor::div[contains(@class,'rounded-xl')][1]");
    await expect(rafaelRow.getByText("Confirmada")).toBeVisible();
    await rafaelRow.getByRole("button", { name: "Registrar check-in" }).dispatchEvent("click");
    await expect(page.getByText("Check-in registrado.")).toBeVisible();
    await expect(rafaelRow.getByRole("button", { name: "Check-in OK" })).toBeVisible();
  });
});
