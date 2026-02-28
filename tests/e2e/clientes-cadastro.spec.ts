import { expect, test, type Page } from "@playwright/test";

const MOCK_LOGIN_KEY = "academia-mock-logged-in";

function gerarDigitos(seed: number, length: number): string {
  return String(seed).replace(/\D/g, "").padStart(length, "0").slice(-length);
}

type ClientePayload = {
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  nascimento: string;
};

async function abrirComSessaoMockE2e(page: Page) {
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
  await page.goto("/clientes");
  await expect(page.getByRole("heading", { name: "Clientes" })).toBeVisible();
}

async function preencherDadosPessoais(page: Page, input: ClientePayload) {
  await page.getByLabel("Nome completo *").fill(input.nome);
  await page.getByLabel("E-mail *").fill(input.email);
  await page.getByLabel("Telefone *").fill(input.telefone);
  await page.getByLabel("CPF *").fill(input.cpf);
  await page.getByLabel("Data de nascimento *").fill(input.nascimento);
  await page.getByRole("combobox").first().click();
  await page.getByRole("option", { name: "Masculino" }).click();
}

test.describe("Cadastro de clientes (Playwright)", () => {
  test("Cenário 1: cadastra cliente com plano e pagamento", async ({ page }) => {
    const now = Date.now();
    const payload: ClientePayload = {
      nome: `Cliente E2E ${now}`,
      email: `cliente.e2e.${now}@teste.com`,
      telefone: "(11) 91234-5678",
      cpf: gerarDigitos(now, 11),
      nascimento: "1990-01-01",
    };

    await abrirComSessaoMockE2e(page);

    await page.getByRole("button", { name: "Novo cliente" }).click();
    await expect(page.getByRole("heading", { name: "Novo cliente" })).toBeVisible();

    await preencherDadosPessoais(page, payload);
    await page.getByRole("button", { name: "Venda" }).click();

    await expect(page.getByText("Escolha o plano")).toBeVisible();
    await page.getByRole("button", { name: /Mensal Básico/ }).click();
    await page.getByRole("button", { name: "Próximo" }).click();

    await expect(page.getByText("Data de início *")).toBeVisible();
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Dinheiro" }).click();
    await page.getByRole("button", { name: "Próximo" }).click();

    await expect(page.getByText("Cadastro realizado!")).toBeVisible();
    await page.getByRole("button", { name: "Fechar" }).click();

    await expect(page.getByRole("row").filter({ hasText: payload.nome })).toBeVisible();
    await expect(
      page.getByRole("row").filter({ hasText: payload.nome }).getByText("Ativo"),
    ).toBeVisible();
  });

  test("Cenário 2: validação impede avanço sem dados obrigatórios", async ({ page }) => {
    await abrirComSessaoMockE2e(page);

    await page.getByRole("button", { name: "Novo cliente" }).click();
    await page.getByRole("button", { name: "Venda" }).click();

    await expect(page.getByRole("heading", { name: "Novo cliente" })).toBeVisible();
    await expect(page.getByText("Escolha o plano")).not.toBeVisible();
    await expect(page.getByLabel("Nome completo *")).toBeVisible();
    await expect(page.getByRole("button", { name: "Finalizar" })).toBeVisible();
  });

  test("Cenário 3: cria cliente sem matrícula (cadastro direto)", async ({ page }) => {
    const now = Date.now();
    const payload: ClientePayload = {
      nome: `Cliente Inativo E2E ${now}`,
      email: `cliente.inativo.e2e.${now}@teste.com`,
      telefone: "(11) 92345-6780",
      cpf: gerarDigitos(now + 11, 11),
      nascimento: "1988-05-20",
    };

    await abrirComSessaoMockE2e(page);

    await page.getByRole("button", { name: "Novo cliente" }).click();
    await preencherDadosPessoais(page, payload);
    await page.getByRole("button", { name: "Finalizar" }).click();

    await expect(page.getByRole("row").filter({ hasText: payload.nome })).toBeVisible();
    await expect(
      page.getByRole("row").filter({ hasText: payload.nome }).getByText("Inativo"),
    ).toBeVisible();
    await expect(page.getByText("Cadastro realizado!")).toBeHidden();
  });
});
