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
    const funcionarioNome = `Funcionario ${suffix}`;
    const funcionarioEditado = `${funcionarioNome} Editado`;

    await openAdminCrudPage(page, "/administrativo/funcionarios");

    await expect(page.getByRole("heading", { name: "Funcionários" })).toBeVisible();
    await page.getByRole("button", { name: "Cargos" }).click();
    await page.getByRole("button", { name: "Novo cargo" }).click();
    await page.getByRole("dialog").locator("input").first().fill(cargoNome);
    await page.getByRole("dialog").getByRole("button", { name: "Criar" }).click();
    await expect(page.getByRole("row").filter({ hasText: cargoNome })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Cadastro de Cargos" })).toHaveCount(0);

    await page.getByRole("button", { name: "Novo funcionário" }).click();
    await page.getByRole("dialog").locator("input").first().fill(funcionarioNome);
    await selectComboboxOption(
      page,
      page.getByRole("dialog").getByRole("combobox").first(),
      cargoNome,
    );
    await page
      .getByRole("dialog")
      .getByText("Pode ministrar atividades/aulas")
      .locator("..")
      .locator("input")
      .check();
    await page.getByRole("dialog").getByRole("button", { name: "Criar" }).click();

    let funcionarioRow = page.getByRole("row").filter({ hasText: funcionarioNome });
    await expect(funcionarioRow).toBeVisible();

    await funcionarioRow.getByRole("button", { name: "Editar" }).click();
    await page.getByRole("dialog").locator("input").first().fill(funcionarioEditado);
    await page.getByRole("dialog").getByRole("button", { name: "Salvar" }).click();

    funcionarioRow = page.getByRole("row").filter({ hasText: funcionarioEditado });
    await expect(funcionarioRow).toBeVisible();
    await funcionarioRow.getByRole("button", { name: "Desativar" }).click();
    await expect(funcionarioRow.getByText("Inativo")).toBeVisible();

    await funcionarioRow.getByRole("button", { name: "Remover" }).click();
    await expect(page.getByRole("row").filter({ hasText: funcionarioEditado })).toHaveCount(0);
  });
});
