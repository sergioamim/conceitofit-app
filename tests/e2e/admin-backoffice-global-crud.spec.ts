import { expect, test, type Page } from "./support/test";
import { openAdminCrudPage, selectComboboxOption, uniqueSuffix } from "./support/admin-crud-helpers";

async function gotoAdminCrudRoute(page: Page, path: string) {
  try {
    await page.goto(path, { waitUntil: "commit" });
  } catch (error) {
    if (!(error instanceof Error) || !/ERR_ABORTED|frame was detached/i.test(error.message)) {
      throw error;
    }
    await page.goto(path, { waitUntil: "domcontentloaded" });
  }
}

test.describe("Admin backoffice global CRUD", () => {
  test("cobre academias, unidades e segurança global", async ({ page }) => {
    const suffix = uniqueSuffix();
    const academiaId = "academia-11";
    const academiaNome = `Academia E2E ${suffix}`;
    const unidadeNome = `Unidade Expansao ${suffix}`;
    const unidadeDocumento = `11${suffix}22000190`;

    await openAdminCrudPage(page, "/admin/academias");

    await page.locator("#academia-nome").fill(academiaNome);
    await page.locator("#academia-doc").fill("55332211000177");
    await page.getByRole("button", { name: "Criar academia" }).click();

    const academiaRow = page.getByRole("row").filter({ hasText: academiaNome });
    await expect(academiaRow).toBeVisible();

    await gotoAdminCrudRoute(page, `/admin/academias/${academiaId}`);
    await expect(page.getByRole("heading", { name: academiaNome })).toBeVisible();
    await page.getByLabel("E-mail").fill(`rede-${suffix}@qa.local`);
    await page.getByRole("button", { name: "Salvar academia" }).click();
    await expect(page.getByLabel("E-mail")).toHaveValue(`rede-${suffix}@qa.local`);

    await expect(page.getByRole("link", { name: "Nova unidade" })).toHaveAttribute(
      "href",
      `/admin/unidades?academiaId=${academiaId}`,
    );
    await gotoAdminCrudRoute(page, `/admin/unidades?academiaId=${academiaId}`);
    await expect(page.getByRole("heading", { name: "Unidades (tenants)" })).toBeVisible();

    await page.locator("#backoffice-unidade-nome").fill(unidadeNome);
    await page.locator("#backoffice-unidade-documento").fill(unidadeDocumento);
    await page.locator("#backoffice-unidade-subdomain").fill(`exp-${suffix}`);
    await page.locator("#backoffice-unidade-email").fill(`unidade-${suffix}@qa.local`);
    await page.getByRole("button", { name: "Criar unidade" }).click();

    const unidadeRow = page.getByRole("row").filter({ hasText: unidadeNome });
    await expect(unidadeRow).toBeVisible();
    await unidadeRow.getByRole("button", { name: "Desativar" }).click();
    await expect(unidadeRow.getByText("Inativa")).toBeVisible();

    await gotoAdminCrudRoute(page, "/admin/seguranca/usuarios");
    await expect(page.getByRole("heading", { name: "Usuários e acessos" })).toBeVisible();

    await page.getByLabel("Pessoa, e-mail ou CPF").fill("Sergio");
    await page.getByRole("button", { name: "Aplicar filtros" }).click();
    await page.getByRole("link", { name: "Abrir governança" }).first().click();
    await page.waitForURL("**/admin/seguranca/usuarios/user-admin-global", { timeout: 15_000 });

    await expect(page.getByRole("heading", { name: "Sergio Amim" })).toBeVisible({ timeout: 15_000 });
    await page.getByRole("tab", { name: "Escopos e acessos" }).click();

    await selectComboboxOption(
      page,
      page.getByRole("combobox", { name: "Unidade para associar" }),
      `Academia E2E ${suffix} · ${unidadeNome}`,
    );
    await selectComboboxOption(
      page,
      page.getByText("Virar base operacional").locator("..").getByRole("combobox"),
      "Sim",
    );
    await selectComboboxOption(
      page,
      page.getByRole("combobox", { name: "Papel inicial do acesso" }),
      "FINANCEIRO",
    );
    await page.getByRole("button", { name: "Confirmar acesso" }).click();

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
