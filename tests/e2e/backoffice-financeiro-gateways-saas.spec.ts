import { expect, test, type Page } from "@playwright/test";
import { uniqueSuffix, selectComboboxOption } from "./support/admin-crud-helpers";
import { clickToOpenDialog, navigateAndWaitForHeading } from "./support/interactions";
import { installBackofficeFinanceiroMocks } from "./support/stubs/backoffice-financeiro";

async function openPage(page: Page) {
  await installBackofficeFinanceiroMocks(page);
  await navigateAndWaitForHeading(page, "/admin/financeiro/gateways", /Gateways de pagamento/i);
}

test.describe("Backoffice financeiro SaaS - gateways", () => {
  test("lista gateways por provedor e ambiente", async ({ page }) => {
    await openPage(page);

    await expect(page.getByRole("row").filter({ hasText: "Stripe Principal" })).toContainText("Stripe");
    await expect(page.getByRole("row").filter({ hasText: "Stripe Principal" })).toContainText("Produção");
    await expect(page.getByRole("row").filter({ hasText: "Pagar.me Backup" })).toContainText("Pagar.me");
    await expect(page.getByRole("row").filter({ hasText: "Pagar.me Backup" })).toContainText("Inativo");
  });

  test("cria um novo gateway", async ({ page }) => {
    const suffix = uniqueSuffix();
    const gatewayNome = `Gateway QA ${suffix}`;

    await openPage(page);

    const dialog = await clickToOpenDialog(page, "Novo gateway");
    await dialog.getByLabel("Nome *").fill(gatewayNome);
    await selectComboboxOption(page, dialog.getByLabel("Provedor *"), "Asaas");
    await dialog.getByLabel("Chave da API *").fill(`asaas_live_key_${suffix}`);
    await selectComboboxOption(page, dialog.getByLabel("Ambiente *"), "Produção");
    await dialog.getByLabel("Gateway ativo para processamento").check();
    await dialog.getByRole("button", { name: "Criar gateway" }).click();

    const row = page.getByRole("row").filter({ hasText: gatewayNome });
    await expect(row).toContainText("Asaas");
    await expect(row).toContainText("Produção");
    await expect(row).toContainText("Ativo");
  });

  test("edita a chave e o ambiente de um gateway existente", async ({ page }) => {
    await openPage(page);

    const row = page.getByRole("row").filter({ hasText: "Pagar.me Backup" });
    await row.getByRole("button", { name: "Editar gateway" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("Chave da API *").fill("pk_live_pagarme_prod_4321");
    await selectComboboxOption(page, dialog.getByLabel("Ambiente *"), "Produção");
    await dialog.getByRole("button", { name: "Salvar gateway" }).click();

    await expect(row).toContainText("••••4321");
    await expect(row).toContainText("Produção");
  });

  test("ativa e desativa gateways", async ({ page }) => {
    await openPage(page);

    const stripeRow = page.getByRole("row").filter({ hasText: "Stripe Principal" });
    await stripeRow.getByRole("button", { name: "Desativar gateway" }).click();
    await expect(stripeRow).toContainText("Inativo");

    const pagarmeRow = page.getByRole("row").filter({ hasText: "Pagar.me Backup" });
    await pagarmeRow.getByRole("button", { name: "Ativar gateway" }).click();
    await expect(pagarmeRow).toContainText("Ativo");
  });
});
