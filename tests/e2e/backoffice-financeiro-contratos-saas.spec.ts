import { expect, test, type Page } from "@playwright/test";
import { uniqueSuffix, selectComboboxOption } from "./support/admin-crud-helpers";
import { clickToOpenDialog, navigateAndWaitForHeading } from "./support/interactions";
import { installBackofficeFinanceiroMocks } from "./support/stubs/backoffice-financeiro";

async function openPage(page: Page) {
  await installBackofficeFinanceiroMocks(page);
  await navigateAndWaitForHeading(page, "/admin/financeiro/contratos", /Contratos da plataforma/i);
}

test.describe("Backoffice financeiro SaaS - contratos", () => {
  test("lista contratos com detalhes de plano, vigência e filtros", async ({ page }) => {
    await openPage(page);

    const norteRow = page.getByRole("row").filter({ hasText: "Rede Norte Fitness" });
    await expect(norteRow).toContainText("Growth");
    await expect(norteRow).toContainText("01/01/2026");
    await expect(norteRow).toContainText("31/12/2026");
    await expect(norteRow).toContainText("1 mudança(s)");

    const filters = page.getByRole("combobox");
    await selectComboboxOption(page, filters.nth(1), "Rede Sul Performance");
    await expect(page.getByRole("row").filter({ hasText: "Rede Sul Performance" })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "Rede Norte Fitness" })).toHaveCount(0);

    await selectComboboxOption(page, filters.nth(1), "Todas as academias");
    await selectComboboxOption(page, filters.nth(2), "Enterprise");
    await expect(page.getByRole("row").filter({ hasText: "Rede Sul Performance" })).toContainText("Enterprise");
    await expect(page.getByRole("row").filter({ hasText: "Demo Velocity" })).toHaveCount(0);
  });

  test("cria um novo contrato para uma academia da rede", async ({ page }) => {
    const suffix = uniqueSuffix();

    await openPage(page);

    const dialog = await clickToOpenDialog(page, "Novo contrato");
    const academiaInput = dialog.getByRole("combobox").nth(0);
    await academiaInput.fill("Rede Sul");
    await page.getByRole("option", { name: "Rede Sul Performance" }).click();
    await selectComboboxOption(page, dialog.getByLabel("Plano *"), "Starter");
    await dialog.getByLabel("Data de início *").fill(`2026-05-${suffix.slice(-2)}`);
    await dialog.getByLabel("Data de fim").fill("2027-04-30");
    await selectComboboxOption(page, dialog.getByLabel("Ciclo *"), "Mensal");
    await dialog.getByLabel("Valor negociado *").fill("499");
    await selectComboboxOption(page, dialog.getByLabel("Status"), "Trial");
    await dialog.getByRole("button", { name: "Criar contrato" }).click();

    const row = page.getByRole("row").filter({ hasText: "30/04/2027" });
    await expect(row).toContainText("Rede Sul Performance");
    await expect(row).toContainText("Starter");
    await expect(row).toContainText(/R\$\s*499,00/);
    await expect(row).toContainText("Trial");
  });

  test("renova manualmente a vigência de um contrato existente", async ({ page }) => {
    await openPage(page);

    const row = page.getByRole("row").filter({ hasText: "Rede Norte Fitness" });
    await row.getByRole("button", { name: "Editar contrato" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("Data de fim").fill("2027-03-31");
    await dialog.getByRole("button", { name: "Salvar contrato" }).click();

    await expect(row).toContainText("31/03/2027");
  });

  test("suspende um contrato e interrompe cobranças futuras", async ({ page }) => {
    await openPage(page);

    const row = page.getByRole("row").filter({ hasText: "Rede Norte Fitness" });
    await row.getByRole("button", { name: "Suspender contrato" }).click();

    const dialog = page.getByRole("dialog");
    await dialog.getByPlaceholder("Ex.: inadimplência, renegociação comercial ou pausa temporária.").fill(
      "Inadimplência em revisão."
    );
    await dialog.getByRole("button", { name: "Confirmar suspensão" }).click();

    await expect(row).toContainText("Suspenso");
    await expect(row).toContainText("Inadimplência em revisão.");

    await navigateAndWaitForHeading(page, "/admin/financeiro/cobrancas", /Cobranças da plataforma/i);
    await expect(page.getByRole("row").filter({ hasText: "Rede Norte Fitness" })).toContainText("Cancelado");
  });

  test("reativa um contrato suspenso", async ({ page }) => {
    await openPage(page);

    const row = page.getByRole("row").filter({ hasText: "Demo Velocity" });
    await row.getByRole("button", { name: "Reativar contrato" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Reativar contrato" }).click();

    await expect(row).toContainText("Ativo");
  });
});
