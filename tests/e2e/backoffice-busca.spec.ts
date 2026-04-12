import { expect, test } from "./support/test";
import { openBackofficeWaveCPage } from "./support/stubs/backoffice-wave-c";

test.describe("Backoffice busca global", () => {
  test("busca por nome, CPF e usuário administrador", async ({ page }) => {
    await openBackofficeWaveCPage(page, "/admin/busca", /Busca Global de Pessoas/i);
    const input = page.getByPlaceholder("Buscar por nome, CPF ou e-mail...");

    await input.fill("Marina");
    await expect(page.getByText("Marina Lima")).toBeVisible();

    await input.fill("22233344455");
    await expect(page.getByText("João Castro")).toBeVisible();

    await input.fill("Lúcia");
    await expect(page.getByText("Lúcia Auditoria")).toBeVisible();
    await expect(page.getByText("Administradores")).toBeVisible();
  });
});
