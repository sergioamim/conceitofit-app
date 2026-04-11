import { expect, test } from "@playwright/test";
import { openAdminCrudPage, selectComboboxOption, uniqueSuffix } from "./support/admin-crud-helpers";

test.describe("Admin catálogo CRUD", () => {
  test("cobre serviços e produtos", async ({ page }) => {
    const suffix = uniqueSuffix();
    const servicoNome = `Servico ${suffix}`;
    const servicoEditado = `${servicoNome} Editado`;
    const produtoNome = `Produto ${suffix}`;
    const produtoEditado = `${produtoNome} Editado`;

    await openAdminCrudPage(page, "/administrativo/servicos");

    const dialog = page.getByRole("dialog");

    // Retry até o dialog abrir — flakiness de hidratação no 1º click.
    await expect
      .poll(
        async () => {
          await page.getByRole("button", { name: "Novo serviço" }).click();
          return dialog.isVisible();
        },
        { timeout: 10_000, intervals: [500, 1_000] },
      )
      .toBe(true);
    await dialog.locator("input").first().fill(servicoNome);
    const criarServicoButton = dialog.getByRole("button", { name: "Criar" });
    await criarServicoButton.scrollIntoViewIfNeeded();
    await criarServicoButton.click();

    let servicoRow = page.getByRole("row").filter({ hasText: servicoNome });
    await expect(servicoRow).toBeVisible();
    await servicoRow.getByRole("button", { name: "Editar" }).click();
    await expect(dialog).toBeVisible();
    await dialog.locator("input").first().fill(servicoEditado);
    await dialog.getByRole("button", { name: "Salvar" }).click();

    servicoRow = page.getByRole("row").filter({ hasText: servicoEditado });
    await expect(servicoRow).toBeVisible();
    await servicoRow.getByRole("button", { name: "Desativar" }).click();
    await expect(servicoRow.getByText("Inativo")).toBeVisible();
    await servicoRow.getByRole("button", { name: "Remover" }).click();
    await expect(page.getByRole("row").filter({ hasText: servicoEditado })).toHaveCount(0);

    await page.waitForLoadState("networkidle");
    await page.goto("/administrativo/produtos", { waitUntil: "domcontentloaded" });
    // Aguarda heading hidratar antes de interagir — a primeira interação
    // pós-navegação é flaky em dev mode se o React ainda não hidratou
    // handlers.
    await expect(page.getByRole("heading", { name: "Produtos" })).toBeVisible();

    // Retry até o dialog efetivamente abrir (click pode ser "perdido"
    // durante hidratação inicial do botão).
    await expect
      .poll(
        async () => {
          await page.getByRole("button", { name: "Novo produto" }).click();
          return dialog.isVisible();
        },
        { timeout: 10_000, intervals: [500, 1_000] },
      )
      .toBe(true);
    await dialog.locator("input").nth(0).fill(produtoNome);
    await dialog.locator("input").nth(1).fill(`SKU${suffix}`);
    await dialog.getByRole("button", { name: "Criar" }).click();

    let produtoRow = page.getByRole("row").filter({ hasText: produtoNome });
    await expect(produtoRow).toBeVisible();
    await produtoRow.getByRole("button", { name: "Editar" }).click();
    await expect(dialog).toBeVisible();
    await dialog.locator("input").nth(0).fill(produtoEditado);
    await dialog.getByRole("button", { name: "Salvar" }).click();

    produtoRow = page.getByRole("row").filter({ hasText: produtoEditado });
    await expect(produtoRow).toBeVisible();
    await produtoRow.getByRole("button", { name: "Desativar" }).click();
    await expect(produtoRow.getByText("Inativo")).toBeVisible();
    await produtoRow.getByRole("button", { name: "Remover" }).click();
    await expect(page.getByRole("row").filter({ hasText: produtoEditado })).toHaveCount(0);
  });

  test("cobre convênios", async ({ page }) => {
    const suffix = uniqueSuffix();
    const convenioNome = `Convenio ${suffix}`;
    const convenioEditado = `${convenioNome} Editado`;

    await openAdminCrudPage(page, "/administrativo/convenios");

    const dialog = page.getByRole("dialog");
    await expect
      .poll(
        async () => {
          await page.getByRole("button", { name: "Novo convênio" }).click();
          return dialog.isVisible();
        },
        { timeout: 10_000, intervals: [500, 1_000] },
      )
      .toBe(true);
    await dialog.locator("input").first().fill(convenioNome);
    await dialog.locator('button[type="submit"]').click();

    let convenioRow = page.getByRole("row").filter({ hasText: convenioNome });
    await expect(convenioRow).toBeVisible();
    await convenioRow.getByRole("button", { name: "Editar" }).click();
    await expect(dialog).toBeVisible();
    await dialog.locator("input").first().fill(convenioEditado);
    await dialog.locator('button[type="submit"]').click();

    convenioRow = page.getByRole("row").filter({ hasText: convenioEditado });
    await expect(convenioRow).toBeVisible();
    await convenioRow.getByRole("button", { name: "Desativar" }).click();
    await expect(convenioRow.getByText("Inativo")).toBeVisible();
    await convenioRow.getByRole("button", { name: "Remover" }).click();
    await expect(page.getByRole("row").filter({ hasText: convenioEditado })).toHaveCount(0);
  });

  test("cobre criação e alternância de vouchers", async ({ page }) => {
    const suffix = uniqueSuffix();
    const voucherNome = `Voucher ${suffix}`;

    await openAdminCrudPage(page, "/administrativo/vouchers");

    const dialog = page.getByRole("dialog");
    await expect
      .poll(
        async () => {
          await page.getByRole("button", { name: "Novo voucher" }).click();
          return dialog.isVisible();
        },
        { timeout: 10_000, intervals: [500, 1_000] },
      )
      .toBe(true);
    await selectComboboxOption(page, dialog.getByRole("combobox").nth(1), "Desconto");
    await dialog.getByPlaceholder("Digite o nome do voucher").fill(voucherNome);
    await dialog.locator('input[type="date"]').first().fill("2026-03-17");
    await dialog.locator('input[type="date"]').nth(1).fill("2026-04-17");
    await dialog.locator('input[type="number"]').fill("25");
    await dialog.getByPlaceholder("EX: AMIGO30").fill(`PROMO${suffix}`);
    await dialog.getByRole("button", { name: /Próximo/i }).click();
    await expect(dialog.getByRole("button", { name: /Gerar voucher/i })).toBeVisible();
    await dialog.getByRole("button", { name: /Gerar voucher/i }).click();

    const voucherRow = page.getByRole("row").filter({ hasText: voucherNome });
    await expect(voucherRow).toBeVisible();
    await voucherRow.getByRole("button", { name: "Ver códigos" }).click();
    await expect(page.getByText(`PROMO${suffix}`)).toBeVisible();
    await page.keyboard.press("Escape");
    await voucherRow.getByRole("button", { name: "Desativar" }).click();
    await expect(voucherRow.getByText("Inativo")).toBeVisible();
  });
});
