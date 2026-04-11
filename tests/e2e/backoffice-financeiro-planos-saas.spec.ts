import { expect, test, type Page } from "@playwright/test";
import { uniqueSuffix, selectComboboxOption } from "./support/admin-crud-helpers";
import { clickToOpenDialog, navigateAndWaitForHeading } from "./support/interactions";
import { installBackofficeFinanceiroMocks } from "./support/stubs/backoffice-financeiro";

async function openPage(page: Page) {
  await installBackofficeFinanceiroMocks(page);
  await navigateAndWaitForHeading(page, "/admin/financeiro/planos", /Planos da plataforma/i);
}

test.describe("Backoffice financeiro SaaS - planos", () => {
  test("lista os planos seed com status e features", async ({ page }) => {
    await openPage(page);

    await expect(page.getByRole("row").filter({ hasText: "Starter" })).toContainText("Ativo");
    await expect(page.getByRole("row").filter({ hasText: "Growth" })).toContainText("Ativo");
    await expect(page.getByRole("row").filter({ hasText: "Enterprise" })).toContainText("Inativo");
    await expect(page.getByRole("row").filter({ hasText: "Growth" })).toContainText("App aluno");
  });

  test("cria um novo plano SaaS", async ({ page }) => {
    const suffix = uniqueSuffix();
    const planoNome = `Scale ${suffix}`;

    await openPage(page);

    const dialog = await clickToOpenDialog(page, "Novo plano");
    await dialog.getByLabel("Nome *").fill(planoNome);
    await selectComboboxOption(page, dialog.getByLabel("Ciclo *"), "Anual");
    await dialog.getByLabel("Preço mensal *").fill("899");
    await dialog.getByLabel("Preço anual").fill("9490");
    await dialog.getByLabel("Máx. unidades").fill("15");
    await dialog.getByLabel("Máx. alunos").fill("3200");
    await dialog.getByLabel("Descrição").fill("Plano para redes em expansão.");
    await dialog.getByLabel("Features incluídas").fill("Portal web\nBI\nSuporte prioritário");
    await dialog.getByRole("button", { name: "Criar plano" }).click();

    const row = page.getByRole("row").filter({ hasText: planoNome });
    await expect(row).toBeVisible();
    await expect(row).toContainText(/R\$\s*899,00/);
    await expect(row).toContainText("Suporte prioritário");
  });

  test("edita o preço preservando os demais campos", async ({ page }) => {
    await openPage(page);

    const row = page.getByRole("row").filter({ hasText: "Growth" });
    await row.getByRole("button", { name: "Editar plano" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel("Nome *")).toHaveValue("Growth");
    await expect(dialog.getByLabel("Descrição")).toHaveValue("Expansao com governanca multiunidade.");
    await dialog.getByLabel("Preço mensal *").fill("749");
    await dialog.getByRole("button", { name: "Salvar plano" }).click();

    await expect(row).toContainText(/R\$\s*749,00/);
    await expect(row).toContainText("App aluno");
  });

  test("alterna o status do plano", async ({ page }) => {
    await openPage(page);

    const starterRow = page.getByRole("row").filter({ hasText: "Starter" });
    await starterRow.getByRole("button", { name: "Inativar plano" }).click();
    await expect(starterRow).toContainText("Inativo");

    const enterpriseRow = page.getByRole("row").filter({ hasText: "Enterprise" });
    await enterpriseRow.getByRole("button", { name: "Reativar plano" }).click();
    await expect(enterpriseRow).toContainText("Ativo");
  });
});
