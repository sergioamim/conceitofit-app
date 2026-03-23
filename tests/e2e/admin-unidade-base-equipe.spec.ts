import { expect, test } from "@playwright/test";
import { openAdminCrudPage, selectComboboxOption, uniqueSuffix } from "./support/admin-crud-helpers";

test.describe("Admin unidade base e equipe", () => {
  test("atualiza dados da academia da unidade", async ({ page }) => {
    const suffix = uniqueSuffix();

    await openAdminCrudPage(page, "/administrativo/academia");

    await expect(page.getByRole("heading", { name: "Academia" })).toBeVisible();
    const formInputs = page.getByRole("main").locator("input");
    await formInputs.nth(3).fill(`academia-${suffix}@qa.local`);
    await formInputs.nth(4).fill(`(21) 97777-${suffix}`);
    await page.getByRole("button", { name: "Salvar alteracoes" }).click();

    await expect(formInputs.nth(3)).toHaveValue(`academia-${suffix}@qa.local`);
    await expect(formInputs.nth(4)).toHaveValue(`(21) 97777-${suffix}`);
  });

  test("cobre cargos e funcionários da unidade", async ({ page }) => {
    const suffix = uniqueSuffix();
    const cargoNome = `Cargo ${suffix}`;
    const funcionarioNome = `Colaborador ${suffix}`;
    const nomeRegistro = `${funcionarioNome} Registro`;

    await openAdminCrudPage(page, "/administrativo/funcionarios");

    await expect(page.getByRole("heading", { name: "Workspace de equipe operacional" })).toBeVisible();
    await expect(page.getByRole("button").filter({ hasText: "Lúcia Souza" })).toBeVisible();
    await page.getByRole("button").filter({ hasText: "Lúcia Souza" }).click();
    await page.getByRole("tab", { name: "Permissões" }).click();
    await expect(page.getByText("Unidade Barra")).toBeVisible();
    await page.getByRole("link", { name: "Voltar para a listagem" }).click();

    await page.getByRole("button", { name: "Cargos" }).click();
    await page.getByRole("button", { name: "Novo cargo" }).click();
    await page.getByRole("dialog").locator("input").first().fill(cargoNome);
    await page.getByRole("dialog").getByRole("button", { name: "Criar" }).click();
    await expect(page.getByRole("row").filter({ hasText: cargoNome })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Catálogo de cargos" })).toHaveCount(0);

    await page.getByRole("link", { name: "Novo colaborador" }).click();
    await expect(page).toHaveURL(/\/administrativo\/funcionarios\/novo$/);
    await page.getByLabel("Nome do colaborador").fill(funcionarioNome);
    await page.getByLabel("Contato principal do colaborador").fill(`(21) 98888-${suffix}`);
    await page.getByLabel("E-mail profissional do colaborador").fill(`colaborador-${suffix}@qa.local`);
    await selectComboboxOption(
      page,
      page.getByLabel("Cargo do colaborador"),
      cargoNome,
    );
    await page.getByRole("tab", { name: "Permissões" }).click();
    await page.getByRole("checkbox", { name: "Opera catraca" }).check();
    await selectComboboxOption(page, page.getByLabel("Perfil inicial de acesso"), "Administrador");
    await page.getByRole("button", { name: "Criar colaborador" }).click();
    await expect(page).toHaveURL(/\/administrativo\/funcionarios\/.+/);

    await page.getByRole("tab", { name: "Cadastro" }).click();
    await page.getByLabel("Nome de registro").fill(nomeRegistro);
    await page.getByRole("button", { name: "Salvar ficha" }).click();
    await expect(page.getByText("Ficha do colaborador atualizada.")).toBeVisible();

    await page.getByRole("link", { name: "Voltar para a listagem" }).click();

    let funcionarioRow = page.getByRole("button").filter({ hasText: funcionarioNome });
    await expect(funcionarioRow).toBeVisible();
    await funcionarioRow.click();
    await expect(page.getByRole("textbox", { name: "Nome de registro" })).toHaveValue(nomeRegistro);
    await page.getByRole("link", { name: "Voltar para a listagem" }).click();

    funcionarioRow = page.getByRole("row").filter({ hasText: funcionarioNome }).first();
    await funcionarioRow.getByRole("button", { name: "Desativar" }).click();
    await expect(page.getByText("Colaborador inativado.")).toBeVisible();
    funcionarioRow = page.getByRole("row").filter({ hasText: funcionarioNome }).first();
    await expect(funcionarioRow).toContainText("INATIVO");

    await funcionarioRow.getByRole("button", { name: "Remover" }).evaluate((element: HTMLButtonElement) => element.click());
    await expect(page.getByRole("button").filter({ hasText: funcionarioNome })).toHaveCount(0);
  });
});
