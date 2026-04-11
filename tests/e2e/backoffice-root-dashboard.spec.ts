import { expect, test } from "@playwright/test";
import { openBackofficeWaveCPage } from "./support/stubs/backoffice-wave-c";

test.describe("Backoffice dashboard raiz", () => {
  test("carrega widgets consolidados e navega para um atalho detalhado", async ({ page }) => {
    await openBackofficeWaveCPage(page, "/admin", /Dashboard Admin/i);
    await expect(page.getByText("Total de Academias")).toBeVisible();
    await expect(page.getByText("Unidades Ativas")).toBeVisible();
    await expect(page.getByText("Operação Global")).toBeVisible();
    await expect(page.getByText("Gestão da Plataforma")).toBeVisible();

    await page.getByRole("link", { name: "Saúde Ops Risco & Estabilidade" }).click();
    await expect(page).toHaveURL(/\/admin\/operacional\/saude$/);
    await expect(page.getByRole("heading", { name: /Mapa de saúde das academias/i })).toBeVisible();
  });
});
