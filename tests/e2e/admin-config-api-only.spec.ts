import { expect, test } from "@playwright/test";
import { openAdminCrudPage } from "./support/admin-crud-helpers";

test.describe("Admin config API-only", () => {
  test("abre telas administrativas migradas sem runtime mock", async ({ page }) => {
    await openAdminCrudPage(page, "/administrativo/unidades");
    await expect(page.getByRole("heading", { name: "Unidades" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Nova unidade" })).toBeVisible();

    await openAdminCrudPage(page, "/administrativo/academia");
    await expect(page.getByRole("heading", { name: "Academia" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Salvar altera(c|ç)oes/i })).toBeVisible();

    await openAdminCrudPage(page, "/administrativo/ia");
    await expect(page.getByRole("heading", { name: "Integração com IA" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Atualizar" })).toBeVisible();

    await openAdminCrudPage(page, "/administrativo/conciliacao-bancaria");
    await expect(page.getByRole("heading", { name: "Conciliação bancária" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Importar linhas" })).toBeVisible();
  });
});
