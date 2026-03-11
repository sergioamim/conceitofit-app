import { expect, test, type Page } from "@playwright/test";

type ClientePayload = {
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  nascimento: string;
};

function gerarDigitos(seed: number, length: number): string {
  return String(seed).replace(/\D/g, "").padStart(length, "0").slice(-length);
}

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

async function preencherDadosPessoais(page: Page, input: ClientePayload) {
  await page.getByLabel(/Nome completo/).fill(input.nome);
  await page.getByLabel(/E-mail/).fill(input.email);
  await page.getByLabel(/Telefone \*/).fill(input.telefone);
  await page.getByLabel(/CPF \*/).fill(input.cpf);
  await page.getByLabel(/Data de nascimento/).fill(input.nascimento);
  await page.getByRole("combobox").first().click();
  await page.getByRole("option", { name: "Masculino" }).click();
}

test.describe("Fluxo comercial canônico", () => {
  test("pré-cadastro segue para venda de plano e gera contrato pendente de assinatura", async ({ page }) => {
    const now = Date.now();
    const payload: ClientePayload = {
      nome: `Contrato E2E ${now}`,
      email: `contrato.e2e.${now}@teste.com`,
      telefone: "(11) 93456-7890",
      cpf: gerarDigitos(now, 11),
      nascimento: "1991-04-10",
    };

    await abrirComSessaoMock(page);

    await page.goto("/clientes");
    await expect(page.getByRole("heading", { name: "Clientes" })).toBeVisible();

    await page.getByRole("button", { name: "Novo cliente" }).click();
    await preencherDadosPessoais(page, payload);
    await page.getByRole("button", { name: /Pré-cadastro \+ venda/i }).click();

    await expect(page.getByRole("heading", { name: "Nova Venda" })).toBeVisible();
    await page.getByRole("button", { name: /Mensal S1/ }).click();
    await page.getByRole("button", { name: "Finalizar venda" }).click();

    await expect(page.getByRole("heading", { name: "Recibo da venda" })).toBeVisible();
    await expect(page.getByText("Status atual: pendente de assinatura")).toBeVisible();

    await page.goto("/matriculas");
    await expect(page.getByRole("heading", { name: "Contratos e assinaturas" })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: payload.nome })).toContainText("Pendente assinatura");
    await expect(page.getByRole("row").filter({ hasText: payload.nome })).toContainText("Aguardando assinatura");
  });
});
