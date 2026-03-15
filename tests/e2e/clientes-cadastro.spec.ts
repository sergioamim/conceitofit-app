import { expect, test, type Page } from "@playwright/test";

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

type CreateAlunoResponse = {
  id: string;
};

type CreateAlunoComMatriculaResponse = {
  aluno: {
    id: string;
  };
};

async function abrirComSessaoApiE2e(page: Page) {
  await page.goto("/clientes");
  await page.waitForLoadState("networkidle");
  if (/\/login/.test(page.url())) {
    await page.getByLabel("Usuário").fill("admin@academia.local");
    await page.getByLabel("Senha").fill("12345678");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect
      .poll(() =>
        page.evaluate(() => Boolean(window.localStorage.getItem("academia-auth-token")))
      )
      .toBe(true);

    const stepTenant = page.getByRole("heading", { name: "Unidade prioritária" });
    if (await stepTenant.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.getByRole("combobox").click();
      await page.getByRole("option").first().click();
      await page.getByRole("button", { name: "Salvar e continuar" }).click();
    }
    if (/\/login/.test(page.url())) {
      await page.goto("/clientes");
    }
    await page.waitForLoadState("networkidle");
  }
  await expect(page.getByRole("heading", { name: "Clientes" })).toBeVisible();
}

async function preencherDadosPessoais(page: Page, input: ClientePayload) {
  const modal = page.getByRole("dialog");
  await expect(modal.getByRole("heading", { name: "Novo cliente" })).toBeVisible();
  await modal.locator("#novo-cliente-nome").fill(input.nome);
  await modal.locator("#novo-cliente-email").fill(input.email);
  await modal.locator("#novo-cliente-telefone").fill(input.telefone);
  await modal.locator("#novo-cliente-cpf").fill(input.cpf);
  await modal.locator("#novo-cliente-data-nascimento").fill(input.nascimento);
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

    await abrirComSessaoApiE2e(page);

    await page.getByRole("button", { name: "Novo cliente" }).click();
    await expect(page.getByRole("dialog").getByRole("heading", { name: "Novo cliente" })).toBeVisible();

    await preencherDadosPessoais(page, payload);
    await page.getByRole("button", { name: /Completar cadastro agora/i }).click();

    await expect(page.getByText("Escolha o plano")).toBeVisible();
    await page.getByRole("button", { name: /Mensal B[aá]sico/i }).click();
    await page.getByRole("button", { name: "Próximo" }).click();

    await expect(page.getByText("Data de início *")).toBeVisible();
    await page.getByRole("combobox").last().click();
    await page.getByRole("option", { name: "Dinheiro" }).first().click();
    const createResponsePromise = page.waitForResponse((response) =>
      response.request().method() === "POST"
      && /\/api\/v1\/comercial\/alunos-com-matricula(?:\?|$)/.test(response.url())
    );
    await page.getByRole("button", { name: "Próximo" }).click();
    const createResponse = await createResponsePromise;
    const created = (await createResponse.json()) as CreateAlunoComMatriculaResponse;

    await expect(page.getByText("Cadastro realizado!")).toBeVisible();
    await page.getByRole("button", { name: "Fechar" }).click();

    await page.goto(`/clientes/${created.aluno.id}`);
    await expect(page.getByRole("heading", { name: payload.nome })).toBeVisible();
    await expect(page.getByText(payload.email)).toBeVisible();
  });

  test("Cenário 2: validação impede avanço sem dados obrigatórios", async ({ page }) => {
    await abrirComSessaoApiE2e(page);

    await page.getByRole("button", { name: "Novo cliente" }).click();

    await expect(page.getByRole("dialog").getByRole("heading", { name: "Novo cliente" })).toBeVisible();
    await expect(page.getByText("Escolha o plano")).not.toBeVisible();
    await expect(page.getByRole("dialog").locator("#novo-cliente-nome")).toBeVisible();
    await expect(page.getByRole("dialog").getByRole("button", { name: /Pré-cadastro$/i })).toBeDisabled();
    await expect(page.getByRole("dialog").getByRole("button", { name: /Pré-cadastro \+ venda/i })).toBeDisabled();
    await expect(page.getByRole("dialog").getByRole("button", { name: /Completar cadastro agora/i })).toBeDisabled();
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

    await abrirComSessaoApiE2e(page);

    await page.getByRole("button", { name: "Novo cliente" }).click();
    await preencherDadosPessoais(page, payload);
    const createResponsePromise = page.waitForResponse((response) =>
      response.request().method() === "POST"
      && /\/api\/v1\/comercial\/alunos(?:\?|$)/.test(response.url())
      && !response.url().includes("alunos-com-matricula")
    );
    await page.getByRole("dialog").getByRole("button", { name: /Pré-cadastro$/i }).click();
    const createResponse = await createResponsePromise;
    const created = (await createResponse.json()) as CreateAlunoResponse;

    await expect(page.getByRole("dialog")).toBeHidden();
    await page.goto(`/clientes/${created.id}`);
    await expect(page.getByRole("heading", { name: payload.nome })).toBeVisible();
    await expect(page.getByText(payload.email)).toBeVisible();
  });
});
