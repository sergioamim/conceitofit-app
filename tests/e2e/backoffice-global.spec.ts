import { expect, test, type Page } from "@playwright/test";

async function loginWithRedirect(page: Page, targetPath: string) {
  await page.goto(targetPath);
  await expect(page).toHaveURL(new RegExp(`/login\\?next=${encodeURIComponent(targetPath).replace(/\//g, "\\/")}`));

  await page.getByLabel("Usuário").fill("admin@academia.local");
  await page.getByLabel("Senha").fill("12345678");
  await page.getByRole("button", { name: "Entrar" }).click();

  const targetRegex = new RegExp(`${targetPath.replace(/\//g, "\\/")}$`);
  const navigatedDirectly = await page
    .waitForURL(targetRegex, { timeout: 1500 })
    .then(() => true)
    .catch(() => false);

  if (!navigatedDirectly) {
    const saveTenantButton = page.getByRole("button", { name: /Salvar e continuar/i });
    await expect(saveTenantButton).toBeVisible();
    await page.getByRole("combobox").click();
    await page.getByRole("option").first().click();
    await saveTenantButton.click();
  }

  await expect(page).toHaveURL(targetRegex);
}

test.describe("Backoffice global", () => {
  test("gerencia academias e unidades pelo fluxo principal", async ({ page }) => {
    const stamp = Date.now();
    const academiaDocumento = String(stamp).padStart(14, "0").slice(-14);
    const unidadeDocumento = String(stamp + 111_111).padStart(14, "0").slice(-14);
    const academiaNome = `Academia E2E ${stamp}`;
    const unidadeNome = `Unidade E2E ${stamp}`;
    const unidadeEditada = `${unidadeNome} Editada`;
    const unidadeEmail = `unidade-${stamp}@qa.local`;

    await loginWithRedirect(page, "/admin");
    await expect(page.getByRole("heading", { name: "Dashboard do backoffice" })).toBeVisible();

    await page.goto("/admin/academias");
    await expect(page.getByRole("heading", { name: "Academias" })).toBeVisible();
    await page.getByLabel("Nome *").fill(academiaNome);
    await page.getByLabel("Documento").fill(academiaDocumento);
    await page.getByRole("button", { name: "Criar academia" }).click();

    const academiaRow = page.getByRole("row").filter({ hasText: academiaNome });
    await expect(academiaRow).toBeVisible();
    await academiaRow.click();

    await expect(page.getByRole("heading", { name: academiaNome })).toBeVisible();
    await page.getByLabel("E-mail").fill("backoffice@qa.local");
    await page.getByLabel("Telefone").fill("(11) 98888-7766");
    await page.getByRole("button", { name: "Salvar academia" }).click();
    await expect(page.getByLabel("E-mail")).toHaveValue("backoffice@qa.local");
    await expect(page.getByLabel("Telefone")).toHaveValue("(11) 98888-7766");

    await page.getByRole("link", { name: "Nova unidade" }).click();
    await expect(page.getByRole("heading", { name: "Unidades (tenants)" })).toBeVisible();
    await expect(page.getByText(`Contexto atual: ${academiaNome}.`)).toBeVisible();
    await page.getByLabel("Nome da unidade *").fill(unidadeNome);
    await expect(page.getByLabel("Academia da unidade")).toContainText(academiaNome);
    await page.getByLabel("Documento *").fill(unidadeDocumento);
    await expect(page.getByLabel("Grupo da academia")).toHaveValue(/.+/);
    await page.getByLabel("Subdomínio").fill(`e2e-${stamp}`);
    await page.getByLabel("E-mail *").fill(unidadeEmail);
    await page.getByRole("button", { name: "Criar unidade" }).click();

    const unidadeRow = page.getByRole("row").filter({ hasText: unidadeNome });
    await expect(unidadeRow).toBeVisible();
    await page.getByRole("link", { name: "Abrir academia" }).click();
    await expect(page.getByRole("heading", { name: academiaNome })).toBeVisible();
    const unidadeCard = page.getByText(unidadeNome).locator("..").locator("..");
    await expect(unidadeCard).toBeVisible();
    await unidadeCard.getByRole("link", { name: "Editar unidade" }).click();
    await expect(page.getByRole("button", { name: "Salvar unidade" })).toBeVisible();
    await page.getByLabel("Nome da unidade *").fill(unidadeEditada);
    await page.getByRole("button", { name: "Salvar unidade" }).click();

    const unidadeEditadaRow = page.getByRole("row").filter({ hasText: unidadeEditada });
    await expect(unidadeEditadaRow).toBeVisible();
    await unidadeEditadaRow.getByRole("button", { name: "Desativar" }).click();
    await expect(unidadeEditadaRow.getByText("Inativa")).toBeVisible();
  });
});
