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

    const dialog = page.getByRole("dialog");

    // Retry até o dialog abrir — a 1ª interação pós-navegação é flaky
    // em dev mode se o React ainda não hidratou os handlers do botão.
    await expect
      .poll(
        async () => {
          await page.getByRole("button", { name: "Nova forma" }).click();
          return dialog.isVisible();
        },
        { timeout: 10_000, intervals: [500, 1_000] },
      )
      .toBe(true);
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
    await page.goto("/administrativo/tipos-conta", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Tipos de Conta" })).toBeVisible();

    // Retry até o dialog abrir (mesma flakiness pós-navegação).
    await expect
      .poll(
        async () => {
          await page.getByRole("button", { name: "Novo tipo" }).click();
          return dialog.isVisible();
        },
        { timeout: 10_000, intervals: [500, 1_000] },
      )
      .toBe(true);
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

    const dialog = page.getByRole("dialog");

    await expect
      .poll(
        async () => {
          await page.getByRole("button", { name: "Nova conta bancária" }).click();
          return dialog.isVisible();
        },
        { timeout: 10_000, intervals: [500, 1_000] },
      )
      .toBe(true);
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

    await expect
      .poll(
        async () => {
          await page.getByRole("button", { name: "Nova maquininha" }).click();
          return dialog.isVisible();
        },
        { timeout: 10_000, intervals: [500, 1_000] },
      )
      .toBe(true);
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

    const dialog = page.getByRole("dialog");
    await expect
      .poll(
        async () => {
          await page.getByRole("button", { name: "Nova Atividade" }).click();
          return dialog.isVisible();
        },
        { timeout: 10_000, intervals: [500, 1_000] },
      )
      .toBe(true);
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
    await page.goto("/planos/novo", { waitUntil: "domcontentloaded" });
    // Aguarda o formulário renderizar antes de trocar de tab — se a tab
    // for clicada antes do <PlanoForm /> estar hidratado, o onClick não
    // propaga e activeTab fica como "CONFIG".
    await expect(
      page.getByRole("heading", { name: "Dados do plano" }),
    ).toBeVisible({ timeout: 10_000 });
    const beneficiosTab = page.getByRole("tab", {
      name: "Atividades e benefícios",
    });
    // O botão tem onClick={() => setActiveTab("BENEFICIOS")}. Em dev
    // mode, o Next dev overlay e o Turbopack HMR podem interceptar o
    // primeiro click antes da hidratação completar. Aguardar a tab
    // estar realmente clicável e tentar algumas vezes até o state do
    // React refletir, tolerando o timing inconsistente.
    await expect(beneficiosTab).toBeEnabled();
    await expect
      .poll(
        async () => {
          await beneficiosTab.click();
          return beneficiosTab.getAttribute("aria-selected");
        },
        { timeout: 15_000, intervals: [500, 1_000, 1_500] },
      )
      .toBe("true");
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
