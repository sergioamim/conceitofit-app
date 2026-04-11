import { expect, test } from "@playwright/test";
import { openBackofficeWaveCPage } from "./support/stubs/backoffice-wave-c";

test.describe("Backoffice segurança catálogo", () => {
  test("lista permissões, filtra por módulo e abre os detalhes para edição", async ({ page }) => {
    await openBackofficeWaveCPage(page, "/admin/seguranca/catalogo", /Segurança avançada/i);
    await expect(page.getByText("Gestão de pagamentos")).toBeVisible();
    await expect(page.getByText("Mensageria WhatsApp")).toBeVisible();

    const busca = page.getByPlaceholder("Buscar por chave, rótulo ou módulo");
    await busca.fill("Atendimento");

    await expect(page.getByText("Mensageria WhatsApp")).toBeVisible();
    await expect(page.getByText("Gestão de pagamentos")).toHaveCount(0);

    const whatsappRow = page.getByRole("row").filter({ hasText: "Mensageria WhatsApp" });
    await whatsappRow.getByRole("button", { name: "Editar" }).click();

    await expect(page.locator('input[value="atendimento.whatsapp"]')).toBeVisible();
    await expect(page.locator('input[value="Mensageria WhatsApp"]')).toBeVisible();
    await expect(page.getByLabel("Requer MFA")).toBeChecked();
  });
});
