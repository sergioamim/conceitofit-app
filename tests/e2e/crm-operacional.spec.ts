import { expect, test, type Page } from "@playwright/test";

async function abrirComSessaoMock(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Usuário").fill("admin@academia.local");
  await page.getByLabel("Senha").fill("12345678");
  await page.getByRole("button", { name: "Entrar" }).click();

  const stepTenant = page.getByRole("heading", { name: "Unidade prioritária" });
  if (await stepTenant.isVisible()) {
    await page.getByRole("combobox").click();
    await page.getByRole("option").first().click();
    await page.getByRole("button", { name: "Salvar e continuar" }).click();
  }
}

test.describe("CRM operacional", () => {
  test("navega pelo funil, cria tarefa e configura playbook com cadência", async ({ page }) => {
    const stamp = Date.now();
    const tituloTarefa = `Follow-up E2E ${stamp}`;
    const nomePlaybook = `Playbook E2E ${stamp}`;
    const nomeCadencia = `Cadência E2E ${stamp}`;

    await abrirComSessaoMock(page);

    await page.goto("/crm/prospects-kanban");
    await expect(page.getByRole("heading", { name: "CRM · Funil de Vendas" })).toBeVisible();
    await expect(page.getByText("Clara Matos").first()).toBeVisible();

    await page.goto("/crm/tarefas");
    await expect(page.getByRole("heading", { name: "Tarefas comerciais" })).toBeVisible();
    const taskForm = page.locator("form").first();
    await taskForm.getByLabel("Título da tarefa").fill(tituloTarefa);
    await taskForm.getByLabel("Prospect").selectOption({ label: "Clara Matos" });
    await taskForm.getByLabel("Responsável").selectOption({ label: "Diego Paes" });
    await taskForm.getByLabel("Tipo").selectOption("FOLLOW_UP");
    await taskForm.getByLabel("Contexto do follow-up").fill("Confirmar presença e preparar proposta.");
    await page.getByRole("button", { name: "Criar tarefa" }).click();
    await expect(page.getByText(tituloTarefa)).toBeVisible();

    await page.goto("/crm/playbooks");
    await expect(page.getByRole("heading", { name: "Playbooks e cadências" })).toBeVisible();
    await page.getByLabel("Nome do playbook").fill(nomePlaybook);
    await page.getByLabel("Objetivo").fill("Padronizar abordagem pós-visita.");
    await page.getByLabel("Título da etapa 1").fill("Registrar objeção principal");
    await page.getByLabel("Descrição da etapa 1").fill("Mapear motivo de compra e timing de decisão.");
    await page.getByRole("button", { name: "Criar playbook" }).click();
    await expect(page.getByText(nomePlaybook)).toBeVisible();

    await page.getByRole("tab", { name: "Cadências" }).click();
    await page.getByLabel("Nome da cadência").fill(nomeCadencia);
    await page.getByLabel("Objetivo").fill("Executar sequência de contato em até 48h.");
    await page.getByLabel("Título do passo 1").fill("Enviar mensagem inicial");
    await page.getByLabel("Template / orientação").fill("Mensagem curta com convite para visita experimental.");
    await page.getByRole("button", { name: "Criar cadência" }).click();
    await expect(page.getByText(nomeCadencia)).toBeVisible();

    await page.goto("/crm");
    await expect(page.getByRole("heading", { name: "Workspace CRM" })).toBeVisible();
    await expect(page.getByText(`Tarefa criada: ${tituloTarefa}`)).toBeVisible();
    await expect(page.getByText(`Playbook criado: ${nomePlaybook}`)).toBeVisible();
    await expect(page.getByText(`Cadência criada: ${nomeCadencia}`)).toBeVisible();
    await expect(page.getByText("Automações visíveis ao operador")).toBeVisible();
  });
});
