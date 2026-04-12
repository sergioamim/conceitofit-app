import { expect, test } from "./support/test";
import { clickTabAndWaitSelected } from "./support/interactions";
import { openBackofficeWaveCPage } from "./support/stubs/backoffice-wave-c";

test.describe("Backoffice segurança revisões", () => {
  test("lista revisões pendentes, aprova, nega e registra comentários", async ({ page }) => {
    await openBackofficeWaveCPage(page, "/admin/seguranca/revisoes", /Revisões e auditoria/i);
    await expect(page.getByText("Ana Admin")).toBeVisible();
    await expect(page.getByText("Caio Compliance")).toBeVisible();

    const anaCard = page.locator("div.rounded-2xl").filter({ hasText: "Ana Admin" }).first();
    await anaCard.getByRole("button", { name: "Aprovar" }).click();
    await anaCard.getByPlaceholder("Explique a decisão da revisão.").fill("Recertificação validada pelo backoffice.");
    await anaCard.getByRole("button", { name: "Registrar revisão" }).click();
    await expect(page.getByText("Ana Admin")).toHaveCount(0);

    const caioCard = page.locator("div.rounded-2xl").filter({ hasText: "Caio Compliance" }).first();
    await caioCard.getByRole("button", { name: "Negar" }).click();
    await caioCard.getByPlaceholder("Explique a decisão da revisão.").fill("Escopo deve voltar para a trilha padrão.");
    await caioCard.getByRole("button", { name: "Registrar revisão" }).click();
    await expect(page.getByText("Caio Compliance")).toHaveCount(0);

    const recentChangesTab = page.getByRole("tab", { name: "Mudanças recentes" });
    await clickTabAndWaitSelected(recentChangesTab);
    await expect(page.getByText("Revisão negada · Confirmar permanência no escopo de LGPD")).toBeVisible();
    await expect(page.getByText("Escopo deve voltar para a trilha padrão.")).toBeVisible();
  });
});
