import { expect, test, type Page } from "./support/test";
import { navigateAndWaitForHeading } from "./support/interactions";
import { installBackofficeFinanceiroMocks } from "./support/stubs/backoffice-financeiro";

async function openPage(page: Page) {
  await installBackofficeFinanceiroMocks(page);
  await navigateAndWaitForHeading(page, "/admin/saas", /Metricas SaaS e Onboarding/i);
  await expect(page.getByText("Pipeline de Onboarding (3)")).toBeVisible();
}

test.describe("Backoffice SaaS dashboard", () => {
  test("carrega KPIs e a lista de onboarding", async ({ page }) => {
    await openPage(page);

    await expect(page.getByText("MRR", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /R\$\s*18\.250,00/ })).toBeVisible();
    await expect(page.getByText("Churn Rate")).toBeVisible();
    await expect(page.getByText("2,4%")).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "Rede Norte Fitness" })).toContainText("Ativo");
    await expect(page.getByRole("row").filter({ hasText: "Demo Velocity" })).toContainText("Demo");
  });

  test("renderiza a série temporal com todos os pontos", async ({ page }) => {
    await openPage(page);

    const chartSection = page.getByText("Evolucao — MRR").locator("xpath=ancestor::section[1]");
    await expect(chartSection.locator(".group.relative.flex-1")).toHaveCount(4);
    await expect(chartSection).toContainText("2026-01");
    await expect(chartSection).toContainText("2026-04");
  });

  test("filtra o pipeline de onboarding por status", async ({ page }) => {
    await openPage(page);

    await page.getByRole("button", { name: "Ativas", exact: true }).click();
    await expect(page.getByRole("row").filter({ hasText: "Rede Norte Fitness" })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "Demo Velocity" })).toHaveCount(0);

    await page.getByRole("button", { name: "Demo", exact: true }).click();
    await expect(page.getByRole("row").filter({ hasText: "Demo Velocity" })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "Rede Sul Performance" })).toHaveCount(0);

    await page.getByRole("button", { name: "Inativas", exact: true }).click();
    await expect(page.getByRole("row").filter({ hasText: "Demo Velocity" })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "Rede Norte Fitness" })).toHaveCount(0);
  });
});
