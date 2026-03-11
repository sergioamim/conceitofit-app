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

test.describe("Backoffice importacao EVO", () => {
  test("cria unidade com ETL preparado e conclui job pelo fluxo principal", async ({ page }) => {
    const stamp = Date.now();
    const unidadeNome = `Unidade ETL ${stamp}`;

    await loginWithRedirect(page, "/admin/unidades");
    await expect(page.getByRole("heading", { name: "Unidades (tenants)" })).toBeVisible();

    await page.getByLabel("Nome da unidade *").fill(unidadeNome);
    await page.getByLabel("Academia da unidade").click();
    await page.getByRole("option").first().click();
    await page.getByLabel("Grupo *").fill(`GRP-ETL-${stamp}`);
    await page.getByLabel("Subdomínio").fill(`etl-${stamp}`);
    await page.getByLabel("Estratégia inicial da unidade").click();
    await page.getByRole("option", { name: "Preparar ETL agora" }).click();
    await page.getByLabel("ID Filial EVO").fill("777");
    await page.getByRole("button", { name: "Criar unidade" }).click();

    const unidadeRow = page.getByRole("row").filter({ hasText: unidadeNome });
    await expect(unidadeRow).toBeVisible();
    await expect(unidadeRow.getByText("Preparar ETL")).toBeVisible();
    await expect(unidadeRow.getByText("Aguardando importação")).toBeVisible();
    await expect(unidadeRow.getByText("EVO: 777")).toBeVisible();

    await unidadeRow.getByRole("link", { name: "Importação" }).click();
    await expect(page).toHaveURL(/\/admin\/importacao-evo-p0\?tenantId=/);
    await expect(page.getByRole("heading", { name: "Acompanhamento de Importação EVO P0" })).toBeVisible();

    await page.getByRole("tab", { name: "Importar por Pacote (ZIP/CSV)" }).click();
    await expect(page.getByLabel("EVO Unidade")).toHaveValue("777");
    await page.locator("#pacoteArquivo").setInputFiles({
      name: "pacote-e2e.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("id,nome\n1,Ana"),
    });
    await page.getByRole("button", { name: "Analisar pacote" }).click();
    await expect(page.getByText("Upload ID:")).toBeVisible();
    await page.getByRole("button", { name: "Criar Job" }).click();

    await expect(page.getByText("Job de importação")).toBeVisible();
    await expect(page.getByText("CONCLUIDO")).toBeVisible({ timeout: 15000 });

    await page.goto("/admin/unidades");
    const unidadeAtualizada = page.getByRole("row").filter({ hasText: unidadeNome });
    await expect(unidadeAtualizada).toBeVisible();
    await expect(unidadeAtualizada.getByText("Pronta")).toBeVisible();
  });
});
