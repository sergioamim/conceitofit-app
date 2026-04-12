import { expect, test, type Page } from "./support/test";
import { navigateAndWaitForHeading } from "./support/interactions";
import { installBackofficeFinanceiroMocks } from "./support/stubs/backoffice-financeiro";

async function openPage(page: Page) {
  await installBackofficeFinanceiroMocks(page);
  await navigateAndWaitForHeading(page, "/admin/onboarding/provisionar", /Provisionar nova academia/i);
}

async function fillProvisionForm(page: Page) {
  await page.getByLabel("Nome da academia").fill("Academia Wave B");
  await page.getByLabel("CNPJ").fill("11.444.777/0001-61");
  await page.getByLabel("Telefone").fill("(21) 99999-0000");
  await page.getByLabel("Nome da unidade principal").fill("Wave B Matriz");
  await page.getByLabel("Nome do administrador").fill("Mariana Wave");
  await page.getByLabel("E-mail do administrador").fill("mariana.wave@academia.local");
}

test.describe("Backoffice onboarding - provisionar academia", () => {
  test("carrega o estado inicial com checklist e prévia vazia", async ({ page }) => {
    await openPage(page);

    await expect(page.getByText("Checklist operacional")).toBeVisible();
    await expect(page.getByText("Fluxo pensado para o time global provisionar uma nova academia sem sair do backoffice.")).toBeVisible();
    await expect(page.getByText("Ainda não informado")).toBeVisible();
    await expect(page.getByText("Sem e-mail informado")).toBeVisible();
    await expect(page.getByText("Sem telefone informado")).toBeVisible();
    await expect(page.locator("textarea[readonly]")).toContainText(
      "As credenciais provisionadas aparecerão aqui assim que a API responder com sucesso.",
    );
  });

  test("provisiona a academia e exibe as credenciais geradas", async ({ page }) => {
    await openPage(page);
    await fillProvisionForm(page);

    await page.getByRole("button", { name: "Provisionar academia" }).click();

    await expect(page.getByText("Credenciais geradas")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Academia", exact: true })).toHaveValue("Academia Wave B");
    await expect(page.getByRole("textbox", { name: "Unidade principal", exact: true })).toHaveValue("Wave B Matriz");
    await expect(page.getByRole("textbox", { name: "E-mail", exact: true })).toHaveValue("mariana.wave@academia.local");
    await expect(page.getByRole("textbox", { name: "Senha temporária", exact: true })).toHaveValue("Senha#Inicial123");
    await expect(page.getByRole("button", { name: "Copiar credenciais" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Abre WhatsApp com a mensagem pronta" })).toHaveAttribute(
      "href",
      /wa\.me\/21999990000/,
    );
  });

  test("atualiza a prévia durante a digitação e permite limpar o formulário", async ({ page }) => {
    await openPage(page);

    await page.getByLabel("Nome do administrador").fill("Carla Operações");
    await page.getByLabel("E-mail do administrador").fill("carla@academia.local");
    await page.getByLabel("Telefone").fill("(11) 98888-7766");

    const preview = page.locator("textarea[readonly]");
    await expect(page.getByText("Carla Operações")).toBeVisible();
    await expect(page.getByText("carla@academia.local")).toBeVisible();
    await expect(page.getByText("(11) 98888-7766")).toBeVisible();
    await expect(preview).toContainText("As credenciais provisionadas aparecerão aqui");

    await page.getByRole("button", { name: "Limpar formulário" }).click();

    await expect(page.getByLabel("Nome do administrador")).toHaveValue("");
    await expect(page.getByLabel("E-mail do administrador")).toHaveValue("");
    await expect(page.getByLabel("Telefone")).toHaveValue("");
    await expect(page.getByText("Ainda não informado")).toBeVisible();
    await expect(page.getByText("Sem e-mail informado")).toBeVisible();
  });
});
