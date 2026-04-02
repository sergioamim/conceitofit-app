import { expect, test, type Page } from "@playwright/test";
import { installPublicJourneyApiMocks, seedAuthenticatedSession } from "./support/backend-only-stubs";

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

async function abrirRota(page: Page, url: string, matcher: RegExp) {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("ERR_ABORTED")) {
      throw error;
    }
  }
  await page.waitForURL(matcher, { timeout: 30_000 });
}

async function abrirComSessaoApiE2e(page: Page) {
  await installPublicJourneyApiMocks(page);
  await seedAuthenticatedSession(page, {
    tenantId: "tenant-mananciais-s1",
    tenantName: "MANANCIAIS - S1",
    availableTenants: [{ tenantId: "tenant-mananciais-s1", defaultTenant: true }],
  });
  await abrirRota(page, "/clientes", /\/clientes(?:\?|$)/);
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "Clientes" })).toBeVisible();
}

async function selecionarPlano(page: Page, nomePlano: RegExp) {
  const radio = page.getByRole("radio", { name: nomePlano });
  if (await radio.count()) {
    await radio.click();
    return;
  }

  await page.getByRole("button", { name: nomePlano }).click();
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
    await page.getByRole("dialog").getByRole("button", { name: /Continuar com plano/i }).click();

    await expect(page.getByText("Escolha o plano")).toBeVisible();
    await selecionarPlano(page, /Plano Premium/i);
    await page.getByRole("button", { name: "Próximo" }).click();

    await expect(page.getByText(/Data de inicio \*/i)).toBeVisible();
    await expect(page.getByText(/Forma de pagamento \*/i)).toBeVisible();
    await page.getByRole("combobox").filter({ hasText: /Selecione/i }).click();
    await page.getByRole("option", { name: "Dinheiro" }).first().click();
    const createResponsePromise = page.waitForResponse((response) =>
      response.request().method() === "POST"
      && /\/api\/v1\/comercial\/alunos-com-matricula(?:\?|$)/.test(response.url())
    );
    await page.getByRole("button", { name: "Próximo" }).click();
    const createResponse = await createResponsePromise;
    const created = (await createResponse.json()) as CreateAlunoComMatriculaResponse;

    const successDialog = page.getByRole("dialog").filter({ hasText: "Cadastro realizado!" });
    await expect(successDialog).toBeVisible();
    await successDialog.getByRole("button", { name: /^Fechar$/ }).click();

    await abrirRota(page, `/clientes/${created.aluno.id}`, new RegExp(`/clientes/${created.aluno.id}$`));
    await expect(page.getByRole("heading", { name: payload.nome })).toBeVisible();
    await expect(page.getByText(payload.email)).toBeVisible();
  });

  test("Cenário 2: validação impede avanço sem dados obrigatórios", async ({ page }) => {
    await abrirComSessaoApiE2e(page);

    await page.getByRole("button", { name: "Novo cliente" }).click();

    await expect(page.getByRole("dialog").getByRole("heading", { name: "Novo cliente" })).toBeVisible();
    await expect(page.getByText("Escolha o plano")).not.toBeVisible();
    await expect(page.getByRole("dialog").locator("#novo-cliente-nome")).toBeVisible();
    await expect(page.getByRole("dialog").getByRole("button", { name: /Apenas pre-cadastro/i })).toBeDisabled();
    await expect(page.getByRole("dialog").getByRole("button", { name: /Pré-cadastro \+ venda/i })).toBeDisabled();
    await expect(page.getByRole("dialog").getByRole("button", { name: /Continuar com plano/i })).toBeDisabled();
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
    await page.getByRole("dialog").getByRole("button", { name: /Apenas pre-cadastro/i }).click();
    const createResponse = await createResponsePromise;
    const created = (await createResponse.json()) as CreateAlunoResponse;

    await expect(page.getByRole("dialog")).toBeHidden();
    await abrirRota(page, `/clientes/${created.id}`, new RegExp(`/clientes/${created.id}$`));
    await expect(page.getByRole("heading", { name: payload.nome })).toBeVisible();
    await expect(page.getByText(payload.email)).toBeVisible();
  });
});
