import { expect, test } from "@playwright/test";
import { openAdminCrudPage, uniqueSuffix } from "./support/admin-crud-helpers";
import {
  clickTabAndWaitSelected,
  clickToOpenDialog,
  navigateAndWaitForHeading,
} from "./support/interactions";

test.describe("Admin financeiro e operacional CRUD", () => {
  test("cobre formas de pagamento e tipos de conta", async ({ page }) => {
    const suffix = uniqueSuffix();
    const formaNome = `Forma ${suffix}`;
    const formaEditada = `${formaNome} Editada`;
    const tipoContaNome = `Tipo ${suffix}`;
    const tipoContaEditado = `${tipoContaNome} Editado`;

    await openAdminCrudPage(page, "/administrativo/formas-pagamento");

    const dialog = await clickToOpenDialog(page, "Nova forma");
    await dialog.locator("input").first().fill(formaNome);
    await dialog.getByRole("button", { name: /Criar|Salvar/ }).click();

    let formaRow = page.getByRole("row").filter({ hasText: formaNome });
    await expect(formaRow).toBeVisible();
    await formaRow.getByRole("button", { name: "Editar" }).click();
    await expect(dialog).toBeVisible();
    await dialog.locator("input").first().fill(formaEditada);
    await dialog.getByRole("button", { name: "Salvar" }).click();

    formaRow = page.getByRole("row").filter({ hasText: formaEditada });
    await expect(formaRow).toBeVisible();
    await formaRow.getByRole("button", { name: "Desativar" }).click();
    await expect(formaRow.getByText("Inativo")).toBeVisible();
    await formaRow.getByRole("button", { name: "Remover" }).click();
    await expect(page.getByRole("row").filter({ hasText: formaEditada })).toHaveCount(0);

    await page.waitForLoadState("networkidle");
    await navigateAndWaitForHeading(page, "/administrativo/tipos-conta", "Tipos de Conta");
    await clickToOpenDialog(page, "Novo tipo");
    await dialog.locator("input").first().fill(tipoContaNome);
    await dialog.getByRole("button", { name: "Salvar tipo" }).click();

    let tipoRow = page.getByRole("row").filter({ hasText: tipoContaNome });
    await expect(tipoRow).toBeVisible();
    await tipoRow.getByRole("button", { name: "Editar" }).click();
    await expect(dialog).toBeVisible();
    await dialog.locator("input").first().fill(tipoContaEditado);
    await dialog.getByRole("button", { name: "Salvar alterações" }).click();

    tipoRow = page.getByRole("row").filter({ hasText: tipoContaEditado });
    await expect(tipoRow).toBeVisible();
    await tipoRow.getByRole("button", { name: "Desativar" }).click();
    await expect(page.getByRole("row").filter({ hasText: tipoContaEditado })).toHaveCount(0);
    await page.getByRole("checkbox", { name: "Mostrar inativos" }).check();
    tipoRow = page.getByRole("row").filter({ hasText: tipoContaEditado });
    await expect(tipoRow).toBeVisible();
    await expect(tipoRow.getByText("Inativo")).toBeVisible();
  });

  test("cobre contas bancárias e maquininhas", async ({ page }) => {
    const suffix = uniqueSuffix();
    const contaNome = `Conta ${suffix}`;
    const contaEditada = `${contaNome} Editada`;
    const maquininhaNome = `Maquininha ${suffix}`;
    const maquininhaEditada = `${maquininhaNome} Editada`;

    await openAdminCrudPage(page, "/administrativo/contas-bancarias");

    const dialog = await clickToOpenDialog(page, "Nova conta bancária");
    await dialog.locator("input").nth(0).fill(contaNome);
    await dialog.locator("input").nth(1).fill("Banco QA");
    await dialog.locator("input").nth(2).fill("1234");
    await dialog.locator("input").nth(3).fill("98765");
    await dialog.locator("input").nth(4).fill("0");
    await dialog.locator("input").nth(5).fill("Conceito Fit QA");
    await dialog.getByRole("button", { name: "Salvar" }).click();

    let contaRow = page.getByRole("row").filter({ hasText: contaNome });
    await expect(contaRow).toBeVisible();
    await contaRow.getByRole("button", { name: "Editar" }).click();
    await expect(dialog).toBeVisible();
    await dialog.locator("input").nth(0).fill(contaEditada);
    await dialog.getByRole("button", { name: "Salvar alterações" }).click();

    contaRow = page.getByRole("row").filter({ hasText: contaEditada });
    await expect(contaRow).toBeVisible();
    await contaRow.getByRole("button", { name: "Inativar" }).click();
    await expect(contaRow.getByText("Inativa")).toBeVisible();

    await page.waitForLoadState("networkidle");
    await page.goto("/administrativo/maquininhas", { waitUntil: "domcontentloaded" });

    await clickToOpenDialog(page, "Nova maquininha");
    await dialog.locator("input").nth(0).fill(maquininhaNome);
    await dialog.locator("input").nth(1).fill(`TERM-${suffix}`);
    await dialog.getByRole("button", { name: "Salvar" }).click();

    let maquininhaRow = page.getByRole("row").filter({ hasText: maquininhaNome });
    await expect(maquininhaRow).toBeVisible();
    await maquininhaRow.getByRole("button", { name: "Editar" }).click();
    await expect(dialog).toBeVisible();
    await dialog.locator("input").nth(0).fill(maquininhaEditada);
    await dialog.getByRole("button", { name: "Salvar alterações" }).click();

    maquininhaRow = page.getByRole("row").filter({ hasText: maquininhaEditada });
    await expect(maquininhaRow).toBeVisible();
    await maquininhaRow.getByRole("button", { name: "Inativar" }).click();
    await expect(maquininhaRow.getByText("Inativa")).toBeVisible();
  });

  test("cobre atividades operacionais", async ({ page }) => {
    const suffix = uniqueSuffix();
    const atividadeNome = `Atividade ${suffix}`;
    const atividadeEditada = `${atividadeNome} Editada`;
    const getAtividadeCard = (nome: string) =>
      page
        .getByText(nome, { exact: true })
        .locator("xpath=ancestor::*[contains(@class,'group')][1]");

    await openAdminCrudPage(page, "/atividades");

    const dialog = await clickToOpenDialog(page, "Nova Atividade");
    await page.getByPlaceholder("Ex: Musculação").fill(atividadeNome);
    await page.getByLabel("Permitir check-in para clientes").uncheck();
    await page.getByRole("dialog").getByRole("button", { name: "Criar" }).click();

    await expect(page.getByText(atividadeNome, { exact: true })).toBeVisible();
    await expect(page.getByText("Sem check-in")).toBeVisible();
    const atividadeCard = getAtividadeCard(atividadeNome);
    await atividadeCard.hover();
    await atividadeCard.getByRole("button").nth(0).click();
    await page.getByPlaceholder("Ex: Musculação").fill(atividadeEditada);
    await page.getByLabel("Permitir check-in para clientes").check();
    await page.getByLabel("Check-in obrigatório para participar").check();
    await page.getByRole("dialog").getByRole("button", { name: "Salvar" }).click();

    await expect(page.getByText(atividadeEditada, { exact: true })).toBeVisible();
    await expect(page.getByText("Check-in obrigatório", { exact: true })).toBeVisible();

    await page.waitForLoadState("networkidle");
    await page.goto("/administrativo/atividades-grade", { waitUntil: "domcontentloaded" });
    // Aguarda a página carregar a linha seed ("Musculação") antes de
    // clicar "Nova Grade" — garante que o useAdminCrud já populou o
    // state com atividades, senão o modal abriria vazio/não-interativo.
    await expect(page.getByText("Musculação").first()).toBeVisible({
      timeout: 10_000,
    });
    await page.getByRole("button", { name: "Nova Grade" }).click();
    // `.first()` global pegaria o seletor de unidade do sidebar. Escopar
    // ao dialog garante que o primeiro combobox é o de atividade do form.
    await expect(dialog).toBeVisible();
    await dialog.getByRole("combobox").first().click();
    await page.getByRole("option", { name: atividadeEditada }).click();
    await expect(dialog.getByText("Check-in da atividade:")).toBeVisible();
    await expect(dialog.getByText("obrigatório")).toBeVisible();
    await dialog.getByRole("button", { name: "Cancelar" }).click();

    await page.waitForLoadState("networkidle");
    await navigateAndWaitForHeading(page, "/planos/novo", "Dados do plano");
    const beneficiosTab = page.getByRole("tab", {
      name: "Atividades e benefícios",
    });
    // O botão tem onClick={() => setActiveTab("BENEFICIOS")}. Em dev
    // mode, o Next dev overlay e o Turbopack HMR podem interceptar o
    // primeiro click antes da hidratação completar. Aguardar a tab
    // estar realmente clicável e tentar algumas vezes até o state do
    // React refletir, tolerando o timing inconsistente.
    await clickTabAndWaitSelected(beneficiosTab);
    await expect(page.getByText(atividadeEditada, { exact: true })).toBeVisible();
    await expect(page.getByText("Check-in obrigatório", { exact: true })).toBeVisible();

    await page.waitForLoadState("networkidle");
    await page.goto("/atividades", { waitUntil: "domcontentloaded" });
    const atividadeEditadaCard = getAtividadeCard(atividadeEditada);
    await atividadeEditadaCard.hover();
    await atividadeEditadaCard.getByRole("button").nth(1).click();
    await page.getByRole("button", { name: "Apenas ativas" }).click();
    await expect(page.getByText(atividadeEditada)).toHaveCount(0);
  });
});
