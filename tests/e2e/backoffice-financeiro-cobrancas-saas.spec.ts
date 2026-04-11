import { expect, test, type Page } from "@playwright/test";
import { uniqueSuffix, selectComboboxOption } from "./support/admin-crud-helpers";
import { clickToOpenDialog, navigateAndWaitForHeading } from "./support/interactions";
import { installBackofficeFinanceiroMocks } from "./support/stubs/backoffice-financeiro";

async function openPage(page: Page) {
  await installBackofficeFinanceiroMocks(page);
  await navigateAndWaitForHeading(page, "/admin/financeiro/cobrancas", /Cobranças da plataforma/i);
}

test.describe("Backoffice financeiro SaaS - cobranças", () => {
  test("lista pendentes, pagas e vencidas com filtros por status e academia", async ({ page }) => {
    await openPage(page);

    await expect(page.getByRole("row").filter({ hasText: "Rede Norte Fitness" })).toContainText("Pendente");
    await expect(page.getByRole("row").filter({ hasText: "Rede Sul Performance" })).toContainText("Pago");
    await expect(page.getByRole("row").filter({ hasText: "Demo Velocity" })).toContainText("Vencido");

    const filters = page.getByRole("combobox");
    await selectComboboxOption(page, filters.nth(0), "Pago");
    await expect(page.getByRole("row").filter({ hasText: "Rede Sul Performance" })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "Rede Norte Fitness" })).toHaveCount(0);

    await selectComboboxOption(page, filters.nth(0), "Todos os status");
    await selectComboboxOption(page, filters.nth(1), "Demo Velocity");
    await expect(page.getByRole("row").filter({ hasText: "Demo Velocity" })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "Rede Sul Performance" })).toHaveCount(0);
  });

  test("gera uma cobrança manual para um contrato ativo", async ({ page }) => {
    const suffix = uniqueSuffix();

    await openPage(page);

    const dialog = await clickToOpenDialog(page, "Nova cobrança");
    await selectComboboxOption(page, dialog.getByLabel("Contrato *"), "Rede Norte Fitness · Growth");
    await expect(dialog.getByText("Contrato selecionado")).toBeVisible();
    await dialog.getByLabel("Vencimento *").fill(`2026-05-${suffix.slice(-2)}`);
    await dialog.getByLabel("Valor *").fill("799");
    await dialog.getByLabel("Multa").fill("20");
    await dialog.getByLabel("Juros").fill("5");
    await dialog.getByLabel("Observacoes").fill("Cobrança manual de expansão.");
    await dialog.getByRole("button", { name: "Gerar cobrança" }).click();

    const row = page.getByRole("row").filter({ hasText: `${suffix.slice(-2)}/05/2026` });
    await expect(row).toContainText("Rede Norte Fitness");
    await expect(row).toContainText(/R\$\s*799,00/);
    await expect(row).toContainText("Pendente");
  });

  test("permite registrar baixa manual", async ({ page }) => {
    await openPage(page);

    const row = page.getByRole("row").filter({ hasText: "Rede Norte Fitness" });
    await row.getByRole("button", { name: "Baixa manual" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByPlaceholder("YYYY-MM-DD").fill("2026-04-12");
    await selectComboboxOption(page, dialog.getByRole("combobox"), "PIX");
    await dialog.getByPlaceholder("Ex.: baixa manual aprovada pelo financeiro.").fill("Pagamento conciliado.");
    await dialog.getByRole("button", { name: "Confirmar baixa" }).click();

    await expect(row).toContainText("Pago");
    await expect(row).toContainText("12/04/2026");
    await expect(row).toContainText("PIX");
  });

  test("cancela uma cobrança em aberto", async ({ page }) => {
    await openPage(page);

    const row = page.getByRole("row").filter({ hasText: "Demo Velocity" });
    await row.getByRole("button", { name: "Cancelar cobrança" }).click();

    const alert = page.getByRole("alertdialog");
    await expect(alert).toContainText("Deseja cancelar a cobrança de Demo Velocity");
    await alert.getByRole("button", { name: "Cancelar cobrança" }).click();

    await expect(row).toContainText("Cancelado");
  });
});
