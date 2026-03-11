import { expect, test, type Page } from "@playwright/test";

async function openAuthenticatedPage(page: Page, path: string, heading: string) {
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

  await page.goto(path);
  await expect(page.getByRole("heading", { name: heading })).toBeVisible();
}

test.describe("Admin financeiro e integrações", () => {
  test("nfse salva e valida configuração fiscal", async ({ page }) => {
    await openAuthenticatedPage(page, "/administrativo/nfse", "NFSe e Fiscal");

    await page.getByPlaceholder("Ex.: Rio de Janeiro").fill("Rio de Janeiro Capital");
    await page.getByPlaceholder("https://...").fill("https://hooks.example.test/fiscal");
    await page.getByRole("button", { name: "Salvar configuração" }).click();

    await expect(page.getByText("Configuração fiscal atualizada.")).toBeVisible();

    await page.getByRole("button", { name: "Validar configuração" }).click();
    await expect(page.getByText("Configuração validada com sucesso.")).toBeVisible();
    await expect(page.getByText("Configurada")).toBeVisible();
  });

  test("recebimentos cria cobrança manual e emite nfse", async ({ page }) => {
    await openAuthenticatedPage(page, "/gerencial/recebimentos", "Recebimentos");

    await page.getByRole("button", { name: "Novo recebimento" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Cliente").fill("Cliente Avulso QA");
    await dialog.getByLabel("Descrição *").fill("Avaliação física premium");
    await dialog.getByLabel("Valor *").fill("89.90");
    await dialog.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Pago" }).click();
    await dialog.getByRole("button", { name: "Salvar recebimento" }).click();

    await expect(page.getByText("Recebimento avulso criado.")).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "Avaliação física premium" })).toBeVisible();

    const createdRow = page.getByRole("row").filter({ hasText: "Avaliação física premium" });
    await createdRow.getByRole("button", { name: "Emitir NFSe" }).click();

    await expect(page.getByText("NFSe emitida com sucesso.")).toBeVisible();
    await expect(createdRow.getByText(/NFS-/)).toBeVisible();
  });

  test("agregadores reprocessa divergência e monitoramento limpa falha", async ({ page }) => {
    await openAuthenticatedPage(page, "/gerencial/agregadores", "Agregadores");

    await page.getByRole("combobox").filter({ hasText: "Todos os repasses" }).click();
    await page.getByRole("option", { name: "Divergente" }).click();
    const divergentRow = page.getByRole("row").filter({ hasText: "000984" });
    await expect(divergentRow).toBeVisible();
    await divergentRow.getByRole("button", { name: "Reprocessar" }).click();
    await expect(page.getByText("Transação 000984 reprocessada.")).toBeVisible();
    await expect(divergentRow).not.toBeVisible();

    await page.goto("/administrativo/integracoes");
    await expect(page.getByRole("heading", { name: "Monitoramento de integrações" })).toBeVisible();
    const webhookCard = page.locator("div.rounded-xl.border").filter({ hasText: "Webhook comercial" }).first();
    await webhookCard.getByRole("button", { name: "Reprocessar" }).click();
    await expect(page.getByText("Integração reprocessada com sucesso.")).toBeVisible();
    await expect(webhookCard.getByText("Saudável")).toBeVisible();
  });
});
