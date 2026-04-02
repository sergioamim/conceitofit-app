import { expect, test } from "@playwright/test";
import { openAdminCrudPage, uniqueSuffix } from "./support/admin-crud-helpers";

test.describe("Admin financeiro e operacional CRUD", () => {
  test("cobre formas de pagamento e tipos de conta", async ({ page }) => {
    const suffix = uniqueSuffix();
    const formaNome = `Forma ${suffix}`;
    const formaEditada = `${formaNome} Editada`;
    const tipoContaNome = `Tipo ${suffix}`;
    const tipoContaEditado = `${tipoContaNome} Editado`;

    await openAdminCrudPage(page, "/administrativo/formas-pagamento");

    await page.getByRole("button", { name: "Nova forma" }).click();
    await page.getByRole("dialog").locator("input").first().fill(formaNome);
    await page.getByRole("dialog").getByRole("button", { name: /Criar|Salvar/ }).click();

    let formaRow = page.getByRole("row").filter({ hasText: formaNome });
    await expect(formaRow).toBeVisible();
    await formaRow.getByRole("button", { name: "Editar" }).click();
    await page.getByRole("dialog").locator("input").first().fill(formaEditada);
    await page.getByRole("dialog").getByRole("button", { name: "Salvar" }).click();

    formaRow = page.getByRole("row").filter({ hasText: formaEditada });
    await expect(formaRow).toBeVisible();
    await formaRow.getByRole("button", { name: "Desativar" }).click();
    await expect(formaRow.getByText("Inativo")).toBeVisible();
    await formaRow.getByRole("button", { name: "Remover" }).click();
    await expect(page.getByRole("row").filter({ hasText: formaEditada })).toHaveCount(0);

    await page.goto("/administrativo/tipos-conta");
    await expect(page.getByRole("heading", { name: "Tipos de Conta" })).toBeVisible();

    await page.getByRole("button", { name: "Novo tipo" }).click();
    await page.getByRole("dialog").locator("input").first().fill(tipoContaNome);
    await page.getByRole("dialog").getByRole("button", { name: "Salvar tipo" }).click();

    let tipoRow = page.getByRole("row").filter({ hasText: tipoContaNome });
    await expect(tipoRow).toBeVisible();
    await tipoRow.getByRole("button", { name: "Editar" }).click();
    await page.getByRole("dialog").locator("input").first().fill(tipoContaEditado);
    await page.getByRole("dialog").getByRole("button", { name: "Salvar alterações" }).click();

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

    await page.getByRole("button", { name: "Nova conta bancária" }).click();
    await page.getByRole("dialog").locator("input").nth(0).fill(contaNome);
    await page.getByRole("dialog").locator("input").nth(1).fill("Banco QA");
    await page.getByRole("dialog").locator("input").nth(2).fill("1234");
    await page.getByRole("dialog").locator("input").nth(3).fill("98765");
    await page.getByRole("dialog").locator("input").nth(4).fill("0");
    await page.getByRole("dialog").locator("input").nth(5).fill("Conceito Fit QA");
    await page.getByRole("dialog").getByRole("button", { name: "Salvar" }).click();

    let contaRow = page.getByRole("row").filter({ hasText: contaNome });
    await expect(contaRow).toBeVisible();
    await contaRow.getByRole("button", { name: "Editar" }).click();
    await page.getByRole("dialog").locator("input").nth(0).fill(contaEditada);
    await page.getByRole("dialog").getByRole("button", { name: "Salvar alterações" }).click();

    contaRow = page.getByRole("row").filter({ hasText: contaEditada });
    await expect(contaRow).toBeVisible();
    await contaRow.getByRole("button", { name: "Inativar" }).click();
    await expect(contaRow.getByText("Inativa")).toBeVisible();

    await page.goto("/administrativo/maquininhas");

    await page.getByRole("button", { name: "Nova maquininha" }).click();
    await page.getByRole("dialog").locator("input").nth(0).fill(maquininhaNome);
    await page.getByRole("dialog").locator("input").nth(1).fill(`TERM-${suffix}`);
    await page.getByRole("dialog").getByRole("button", { name: "Salvar" }).click();

    let maquininhaRow = page.getByRole("row").filter({ hasText: maquininhaNome });
    await expect(maquininhaRow).toBeVisible();
    await maquininhaRow.getByRole("button", { name: "Editar" }).click();
    await page.getByRole("dialog").locator("input").nth(0).fill(maquininhaEditada);
    await page.getByRole("dialog").getByRole("button", { name: "Salvar alterações" }).click();

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

    await page.getByRole("button", { name: "Nova Atividade" }).click();
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

    await page.goto("/administrativo/atividades-grade");
    await page.getByRole("button", { name: "Nova Grade" }).click();
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: atividadeEditada }).click();
    await expect(page.getByText("Check-in da atividade:")).toBeVisible();
    await expect(page.getByText("obrigatório")).toBeVisible();
    await page.getByRole("button", { name: "Cancelar" }).click();

    await page.goto("/planos/novo");
    await page.getByRole("tab", { name: "Atividades e benefícios" }).click();
    await expect(page.getByText(atividadeEditada, { exact: true })).toBeVisible();
    await expect(page.getByText("Check-in obrigatório", { exact: true })).toBeVisible();

    await page.goto("/atividades");
    const atividadeEditadaCard = getAtividadeCard(atividadeEditada);
    await atividadeEditadaCard.hover();
    await atividadeEditadaCard.getByRole("button").nth(1).click();
    await page.getByRole("button", { name: "Apenas ativas" }).click();
    await expect(page.getByText(atividadeEditada)).toHaveCount(0);
  });
});
