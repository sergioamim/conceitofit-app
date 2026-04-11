import { expect, test } from "@playwright/test";
import { clickTabAndWaitSelected } from "./support/interactions";
import { openBackofficeWaveCPage } from "./support/stubs/backoffice-wave-c";

test.describe("Backoffice WhatsApp", () => {
  test("carrega configuração, salva token, testa conexão e cria template", async ({ page }) => {
    await openBackofficeWaveCPage(page, "/admin/whatsapp", /^WhatsApp$/i);
    await expect(page.getByText("Boas-vindas aluno")).toBeVisible();

    const configTab = page.getByRole("tab", { name: "Configuração" });
    await clickTabAndWaitSelected(configTab);
    await expect(page.locator("#wa-api-key")).toHaveValue("token-antigo-001");

    await page.locator("#wa-api-key").fill("token-wave-c-999");
    await page.getByRole("button", { name: "Salvar configuração" }).click();
    await expect(page.locator("#wa-api-key")).toHaveValue("token-wave-c-999");

    await page.getByRole("button", { name: "Testar conexão" }).click();
    await expect(page.getByRole("button", { name: "Testar conexão" })).toBeVisible();

    const templatesTab = page.getByRole("tab", { name: "Templates" });
    await clickTabAndWaitSelected(templatesTab);
    await page.getByRole("button", { name: "Novo Template" }).click();

    await page.locator("#tpl-nome").fill("Recuperação ativa");
    await page.locator("#tpl-slug").fill("recovery-active");
    await page.locator("#tpl-conteudo").fill("Olá {{NOME}}, seu plano {{PLANO}} precisa de atenção.");
    await page.locator("#tpl-variables").fill("NOME, PLANO");
    await page.getByRole("button", { name: "Criar" }).click();

    await expect(page.getByText("Recuperação ativa")).toBeVisible();
  });
});
