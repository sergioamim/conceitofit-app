import { expect, test, type Page } from "@playwright/test";

type ClientePayload = {
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  nascimento: string;
};

type CreateVendaResponse = {
  id?: string;
};

type CreateVendaRequest = {
  tipo?: string;
  clienteId?: string;
  itens?: Array<{
    tipo?: string;
    referenciaId?: string;
  }>;
  planoContexto?: {
    planoId?: string;
    dataInicio?: string;
  };
};

function gerarDigitos(seed: number, length: number): string {
  return String(seed).replace(/\D/g, "").padStart(length, "0").slice(-length);
}

async function abrirComSessaoMock(page: Page) {
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
    await page.getByRole("button", { name: /Mensal/i }).click();
    const vendaRequestPromise = page.waitForRequest((request) =>
      request.method() === "POST"
      && /\/api\/v1\/comercial\/vendas(?:\?|$)/.test(request.url())
    );
    const vendaResponsePromise = page.waitForResponse((response) =>
      response.request().method() === "POST"
      && /\/api\/v1\/comercial\/vendas(?:\?|$)/.test(response.url())
    );
    await page.getByRole("button", { name: "Finalizar venda" }).click();
    const vendaRequest = await vendaRequestPromise;
    const vendaResponse = await vendaResponsePromise;
    const payloadVenda = vendaRequest.postDataJSON() as CreateVendaRequest;
    const venda = (await vendaResponse.json()) as CreateVendaResponse;

    expect(vendaResponse.ok()).toBe(true);
    expect(venda.id ?? "").not.toBe("");
    expect(payloadVenda.tipo).toBe("PLANO");
    expect(payloadVenda.clienteId ?? "").not.toBe("");
    expect(payloadVenda.itens?.some((item) => item.tipo === "PLANO")).toBe(true);
    expect(payloadVenda.itens?.some((item) => item.tipo === "SERVICO")).toBe(false);
    expect(payloadVenda.planoContexto?.planoId ?? "").not.toBe("");
    expect(payloadVenda.planoContexto?.dataInicio ?? "").not.toBe("");
  });
});
