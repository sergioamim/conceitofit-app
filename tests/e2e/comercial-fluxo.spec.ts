import { expect, test, type Page } from "@playwright/test";
import { installPublicJourneyApiMocks, seedAuthenticatedSession } from "./support/backend-only-stubs";

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

type CreateAlunoResponse = {
  id: string;
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

function gerarDigitos(seed: number, length: number): string {
  return String(seed).replace(/\D/g, "").padStart(length, "0").slice(-length);
}

async function abrirComSessaoMock(page: Page) {
  await installPublicJourneyApiMocks(page);
  await seedAuthenticatedSession(page, {
    tenantId: "tenant-mananciais-s1",
    tenantName: "MANANCIAIS - S1",
    availableTenants: [{ tenantId: "tenant-mananciais-s1", defaultTenant: true }],
  });
  await abrirRota(page, "/clientes", /\/clientes(?:\?|$)/);
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

test.describe("Fluxo comercial canônico", () => {
  test("pré-cadastro segue para venda de plano e gera contrato pendente de assinatura", async ({ page }) => {
    test.slow();
    const now = Date.now();
    const payload: ClientePayload = {
      nome: `Contrato E2E ${now}`,
      email: `contrato.e2e.${now}@teste.com`,
      telefone: "(11) 93456-7890",
      cpf: gerarDigitos(now, 11),
      nascimento: "1991-04-10",
    };

    await abrirComSessaoMock(page);

    await page.goto("/clientes", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Clientes" })).toBeVisible();

    await page.getByRole("button", { name: "Novo cliente" }).click();
    await preencherDadosPessoais(page, payload);
    const createResponsePromise = page.waitForResponse((response) =>
      response.request().method() === "POST"
      && /\/api\/v1\/comercial\/alunos(?:\?|$)/.test(response.url())
      && !response.url().includes("alunos-com-matricula")
    );
    await page.getByRole("button", { name: /Pré-cadastro \+ venda/i }).click();
    const createResponse = await createResponsePromise;
    expect(createResponse.ok()).toBe(true);
    const created = (await createResponse.json()) as CreateAlunoResponse;

    await abrirRota(
      page,
      `/vendas/nova?clienteId=${encodeURIComponent(created.id)}&prefill=1`,
      /\/vendas\/nova/
    );
    await expect(page.getByRole("heading", { name: "Nova Venda" })).toBeVisible({ timeout: 30_000 });
    await expect(page.locator("#venda-cliente-suggestion")).toHaveValue(
      new RegExp(payload.nome.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      { timeout: 30_000 },
    );
    const cartSection = page.locator("div").filter({
      has: page.getByRole("heading", { name: "Itens da venda" }),
    }).first();
    await selecionarPlano(page, /Plano Premium/i);
    await expect(cartSection).not.toContainText("0 item(ns)");
    await expect(cartSection).toContainText(/Plano Premium/i);
    await expect(cartSection.getByText("Nenhum item adicionado.")).toBeHidden();
    await expect(page.getByRole("button", { name: "Finalizar venda" })).toBeEnabled();
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
