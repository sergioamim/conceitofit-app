import { expect, test } from "./support/test";
import { openBackofficeWaveCPage } from "./support/stubs/backoffice-wave-c";

test.describe("Backoffice BI", () => {
  test("carrega o BI executivo, troca o filtro global e exporta CSV", async ({ page }) => {
    await openBackofficeWaveCPage(page, "/admin/bi", /BI Executivo/i);
    await expect(page.getByText("KPIs executivos por academia — Rede Norte Fitness.")).toBeVisible();
    await expect(page.getByText("Conversao", { exact: true })).toBeVisible();

    const academiaInput = page.getByPlaceholder("Buscar academia...");
    await academiaInput.fill("Sul");
    await page.getByRole("option", { name: "Rede Sul Performance" }).click();

    await expect(page.getByText("KPIs executivos por academia — Rede Sul Performance.")).toBeVisible();
    await expect(page.getByText("33,1%")).toBeVisible();

    await page.getByRole("button", { name: "Exportar" }).click();
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Exportar CSV" }).click(),
    ]);

    expect(download.suggestedFilename()).toContain("bi-executivo");
  });
});
