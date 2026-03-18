import { expect, test } from "@playwright/test";
import { openAdminCrudPage, selectComboboxOption, uniqueSuffix } from "./support/admin-crud-helpers";

test.describe("Admin backoffice global CRUD", () => {
  test("cobre academias, unidades e segurança global", async ({ page }) => {
    const suffix = uniqueSuffix();
    const academiaNome = `Academia E2E ${suffix}`;
    const unidadeNome = `Unidade Expansao ${suffix}`;
    const unidadeDocumento = `11${suffix}22000190`;

    await openAdminCrudPage(page, "/admin/academias");

    await page.getByLabel("Nome *").fill(academiaNome);
    await page.getByLabel("Documento").fill("55332211000177");
    await page.getByRole("button", { name: "Criar academia" }).click();

    const academiaRow = page.getByRole("row").filter({ hasText: academiaNome });
    await expect(academiaRow).toBeVisible();
    await academiaRow.click();

    await expect(page.getByRole("heading", { name: academiaNome })).toBeVisible();
    await page.getByLabel("E-mail").fill(`rede-${suffix}@qa.local`);
    await page.getByRole("button", { name: "Salvar academia" }).click();
    await expect(page.getByLabel("E-mail")).toHaveValue(`rede-${suffix}@qa.local`);

    await page.getByRole("link", { name: "Nova unidade" }).click();
    await expect(page.getByRole("heading", { name: "Unidades (tenants)" })).toBeVisible();

    await page.getByLabel("Nome da unidade *").fill(unidadeNome);
    await page.getByLabel("Documento *").fill(unidadeDocumento);
    await page.getByLabel("Subdomínio").fill(`exp-${suffix}`);
    await page.getByLabel("E-mail *").fill(`unidade-${suffix}@qa.local`);
    await page.getByRole("button", { name: "Criar unidade" }).click();

    const unidadeRow = page.getByRole("row").filter({ hasText: unidadeNome });
    await expect(unidadeRow).toBeVisible();
    await unidadeRow.getByRole("button", { name: "Desativar" }).click();
    await expect(unidadeRow.getByText("Inativa")).toBeVisible();

    await page.goto("/admin/seguranca/usuarios");
    await expect(page.getByRole("heading", { name: "Usuários administrativos" })).toBeVisible();

    await page.getByLabel("Nome ou e-mail").fill("Sergio");
    await page.getByRole("button", { name: "Aplicar filtros" }).click();
    await page.getByRole("link", { name: "Abrir" }).first().click();

    await expect(page.getByRole("heading", { name: "Detalhe do usuário" })).toBeVisible();

    await selectComboboxOption(
      page,
      page.getByRole("combobox", { name: "Unidade para associar" }),
      unidadeNome,
    );
    await selectComboboxOption(
      page,
      page.getByText("Unidade padrão no vínculo").locator("..").getByRole("combobox"),
      "Sim",
    );
    await page.getByRole("button", { name: "Associar unidade" }).click();

    await expect(page.getByText(unidadeNome).first()).toBeVisible();
    await page.getByRole("tab", { name: "Novas unidades" }).click();
    await page.getByLabel("Justificativa operacional").fill(
      `Cobertura administrativa automatizada ${suffix}.`,
    );
    await page.getByRole("button", { name: "Salvar política" }).click();
    await expect(page.getByLabel("Justificativa operacional")).toHaveValue(
      `Cobertura administrativa automatizada ${suffix}.`,
    );
  });
});
