import { expect, test } from "./support/test";
import { openBackofficeWaveCPage } from "./support/stubs/backoffice-wave-c";

test.describe("Backoffice operacional alertas", () => {
  test("lista alertas ativos, filtra por academia e resolve uma ocorrência", async ({ page }) => {
    await openBackofficeWaveCPage(page, "/admin/operacional/alertas", /Alertas e uso de features/i);
    await expect(page.getByText("Sem login administrativo há 12 dias")).toBeVisible();
    await expect(page.getByText("Pico de cancelamentos na última semana")).toBeVisible();

    const academiaFilter = page.getByPlaceholder("Buscar academia...");
    await academiaFilter.fill("Oeste");
    await page.getByRole("option", { name: "Academia Oeste Prime" }).click();

    await expect(page.getByText("Sem login administrativo há 12 dias")).toBeVisible();
    await expect(page.getByText("Pico de cancelamentos na última semana")).toHaveCount(0);

    const alertaRow = page.getByRole("row").filter({ hasText: "Sem login administrativo há 12 dias" });
    await alertaRow.getByRole("button", { name: "Resolver" }).click();

    await expect(page.getByText("Sem login administrativo há 12 dias")).toHaveCount(0);
    await expect(page.getByText("Nenhum alerta corresponde aos filtros aplicados.")).toBeVisible();
  });
});
