import { expect, test } from "./support/test";
import { openBackofficeWaveCPage } from "./support/stubs/backoffice-wave-c";

test.describe("Backoffice operacional saúde", () => {
  test("carrega o mapa de saúde, filtra por criticidade e preserva o link de detalhe", async ({ page }) => {
    await openBackofficeWaveCPage(page, "/admin/operacional/saude", /Mapa de saúde das academias/i);
    await expect(page.getByText("Saudáveis")).toBeVisible();
    await expect(page.getByText("Em risco")).toBeVisible();
    await expect(page.getByText("Críticas")).toBeVisible();
    await expect(page.getByText("Rede Norte Fitness", { exact: true })).toBeVisible();
    await expect(page.getByText("Academia Oeste Prime", { exact: true })).toBeVisible();

    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: "Crítico" }).click();

    const academiaOesteRow = page.getByRole("row").filter({ hasText: "Academia Oeste Prime" });
    await expect(academiaOesteRow).toBeVisible();
    await expect(page.getByText("Rede Norte Fitness", { exact: true })).toHaveCount(0);
    await expect(academiaOesteRow.locator('a[href="/admin/academias/academia-oeste"]')).toBeVisible();
  });
});
