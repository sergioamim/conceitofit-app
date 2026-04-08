import { test, expect, type Page, type Route } from "@playwright/test";
import { installOperationalAppShellMocks, fulfillJson } from "./support/protected-shell-mocks";

/* ---------------------------------------------------------------------------
 * Helpers — seed de dados mock
 * --------------------------------------------------------------------------- */

const TENANT_ID = "tenant-centro";

const CONVERSAS = [
  {
    id: "conv-001",
    tenantId: TENANT_ID,
    academiaId: null,
    unidadeId: null,
    contactId: "contact-001",
    prospectId: null,
    alunoId: "aluno-001",
    status: "ABERTA",
    queue: null,
    ownerUserId: null,
    lastMessagePreview: "Olá, gostaria saber o horário de funcionamento",
    lastMessageAt: "2026-04-08T10:00:00Z",
    aiSummary: null,
    aiIntent: null,
    aiIntentConfidence: null,
    openedAt: "2026-04-08T09:00:00Z",
    closedAt: null,
    createdAt: "2026-04-08T09:00:00Z",
    updatedAt: "2026-04-08T10:00:00Z",
    contatoNome: "Maria Silva",
    contatoTelefone: "+5511999990001",
  },
  {
    id: "conv-002",
    tenantId: TENANT_ID,
    academiaId: null,
    unidadeId: null,
    contactId: "contact-002",
    prospectId: "prospect-001",
    alunoId: null,
    status: "EM_ATENDIMENTO",
    queue: "Vendas",
    ownerUserId: null,
    lastMessagePreview: "Quero saber sobre planos mensais",
    lastMessageAt: "2026-04-08T09:30:00Z",
    aiSummary: null,
    aiIntent: null,
    aiIntentConfidence: null,
    openedAt: "2026-04-08T08:00:00Z",
    closedAt: null,
    createdAt: "2026-04-08T08:00:00Z",
    updatedAt: "2026-04-08T09:30:00Z",
    contatoNome: "João Santos",
    contatoTelefone: "+5511999990002",
  },
  {
    id: "conv-003",
    tenantId: TENANT_ID,
    academiaId: null,
    unidadeId: null,
    contactId: "contact-003",
    prospectId: null,
    alunoId: null,
    status: "PENDENTE",
    queue: null,
    ownerUserId: null,
    lastMessagePreview: "Aguardo retorno sobre cancelamento",
    lastMessageAt: "2026-04-07T15:00:00Z",
    aiSummary: null,
    aiIntent: null,
    aiIntentConfidence: null,
    openedAt: "2026-04-07T14:00:00Z",
    closedAt: null,
    createdAt: "2026-04-07T14:00:00Z",
    updatedAt: "2026-04-07T15:00:00Z",
    contatoNome: "Ana Oliveira",
    contatoTelefone: "+5511999990003",
  },
];

const MENSAGENS_CONV_001 = [
  {
    id: "msg-001",
    conversationId: "conv-001",
    direction: "INBOUND",
    contentType: "TEXTO",
    content: "Olá, bom dia!",
    mediaUrl: null,
    deliveryStatus: "LIDO",
    isAutomated: false,
    createdAt: "2026-04-08T09:00:00Z",
  },
  {
    id: "msg-002",
    conversationId: "conv-001",
    direction: "OUTBOUND",
    contentType: "TEXTO",
    content: "Bom dia! Como posso ajudar?",
    mediaUrl: null,
    deliveryStatus: "LIDO",
    isAutomated: false,
    createdAt: "2026-04-08T09:05:00Z",
  },
  {
    id: "msg-003",
    conversationId: "conv-001",
    direction: "INBOUND",
    contentType: "TEXTO",
    content: "Gostaria de saber o horário de funcionamento",
    mediaUrl: null,
    deliveryStatus: "LIDO",
    isAutomated: false,
    createdAt: "2026-04-08T10:00:00Z",
  },
];

/* ---------------------------------------------------------------------------
 * Helpers — interceptadores de API
 * --------------------------------------------------------------------------- */

function mockConversasApi(page: Page) {
  return page.route("/api/v1/conversas**", async (route: Route) => {
    await fulfillJson(route,{
      content: CONVERSAS,
      pageable: { pageNumber: 0, pageSize: 20 },
      totalPages: 1,
      totalElements: CONVERSAS.length,
      last: true,
      size: 20,
      number: 0,
      first: true,
      numberOfElements: CONVERSAS.length,
      empty: false,
    });
  });
}

function mockConversaDetailApi(page: Page) {
  return page.route("/api/v1/conversas/conv-001**", async (route: Route) => {
    if (route.request().url().includes("/thread")) {
      await fulfillJson(route,{
        content: MENSAGENS_CONV_001,
        pageable: { pageNumber: 0, pageSize: 50 },
        totalPages: 1,
        totalElements: MENSAGENS_CONV_001.length,
        last: true,
        size: 50,
        number: 0,
        first: true,
        numberOfElements: MENSAGENS_CONV_001.length,
        empty: false,
      });
    } else {
      await fulfillJson(route,CONVERSAS[0]);
    }
  });
}

function mockThreadApi(page: Page, conversationId: string) {
  return page.route(
    `/api/v1/conversas/${conversationId}/thread**`,
    async (route: Route) => {
      await fulfillJson(route,{
        content: MENSAGENS_CONV_001,
        pageable: { pageNumber: 0, pageSize: 50 },
        totalPages: 1,
        totalElements: MENSAGENS_CONV_001.length,
        last: true,
        size: 50,
        number: 0,
        first: true,
        numberOfElements: MENSAGENS_CONV_001.length,
        empty: false,
      });
    },
  );
}

function mockSendMessageApi(page: Page) {
  return page.route(
    "/api/v1/conversas/**/mensagens",
    async (route: Route) => {
      await fulfillJson(route,{
        id: "msg-new-001",
        conversationId: "conv-001",
        direction: "OUTBOUND",
        contentType: "TEXTO",
        content: route.request().postDataJSON()?.content ?? "Teste",
        mediaUrl: null,
        deliveryStatus: "PENDENTE",
        isAutomated: false,
        createdAt: "2026-04-08T10:05:00Z",
      });
    },
  );
}

function mockUpdateStatusApi(page: Page) {
  return page.route(
    "/api/v1/conversas/**",
    async (route: Route) => {
      if (route.request().method() === "PATCH") {
        await fulfillJson(route,{
          ...CONVERSAS[0],
          status: "ENCERRADA",
        });
      }
    },
  );
}

function mockSSEStream(page: Page) {
  return page.route("/api/v1/conversas/stream**", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: `event: connected\ndata: {"message":"ok"}\n\n`,
    });
  });
}

/* ---------------------------------------------------------------------------
 * Helpers — instalar todos os mocks
 * --------------------------------------------------------------------------- */

async function installAtendimentoMocks(
  page: Page,
  options?: Parameters<typeof installOperationalAppShellMocks>[1],
) {
  await installOperationalAppShellMocks(page, {
    currentTenantId: TENANT_ID,
    ...options,
  });

  await mockConversasApi(page);
  mockConversaDetailApi(page);
  mockThreadApi(page, "conv-001");
  mockSendMessageApi(page);
  mockUpdateStatusApi(page);
  mockSSEStream(page);
}

/* ---------------------------------------------------------------------------
 * Tests
 * --------------------------------------------------------------------------- */

test.describe("Atendimento — Inbox de Conversas", () => {
  test.beforeEach(async ({ page }) => {
    await installAtendimentoMocks(page);
    await page.goto("/atendimento/inbox");
    // Wait for conversation list to render
    await expect(page.getByText("Maria Silva")).toBeVisible();
  });

  test("cenário 1: listar conversas e selecionar uma conversa", async ({
    page,
  }) => {
    // Verificar que as 3 conversas aparecem na lista
    await expect(page.getByText("Maria Silva")).toBeVisible();
    await expect(page.getByText("João Santos")).toBeVisible();
    await expect(page.getByText("Ana Oliveira")).toBeVisible();

    // Clicar na primeira conversa
    await page.getByText("Maria Silva").click();

    // Verificar que navegou para a página de detalhe
    await expect(page).toHaveURL(/\/atendimento\/inbox\/conv-001/);

    // Verificar que o header mostra nome do contato
    await expect(page.getByRole("heading", { name: "Maria Silva" })).toBeVisible();
  });

  test("cenário 2: thread de mensagens carrega corretamente", async ({
    page,
  }) => {
    // Selecionar conversa
    await page.getByText("Maria Silva").click();
    await expect(page).toHaveURL(/\/atendimento\/inbox\/conv-001/);

    // Verificar que as mensagens aparecem
    await expect(page.getByText("Olá, bom dia!")).toBeVisible();
    await expect(page.getByText("Bom dia! Como posso ajudar?")).toBeVisible();
    await expect(
      page.getByText("Gostaria de saber o horário de funcionamento"),
    ).toBeVisible();

    // Verificar que o header mostra nome e status
    await expect(page.getByRole("heading", { name: "Maria Silva" })).toBeVisible();
    await expect(page.getByText("Aberta")).toBeVisible();
  });

  test("cenário 3: enviar mensagem via MessageInput", async ({ page }) => {
    // Selecionar conversa
    await page.getByText("Maria Silva").click();
    await expect(page).toHaveURL(/\/atendimento\/inbox\/conv-001/);

    // Digitar e enviar mensagem
    const textarea = page.getByRole("textbox", { name: "Mensagem" });
    await textarea.fill("Nosso horário é das 6h às 22h!");
    await textarea.press("Enter");

    // Verificar que o input foi limpo
    await expect(textarea).toBeEmpty();

    // Verificar que a requisição de envio foi feita
    const sendRequest = await page.waitForRequest(
      (req) =>
        req.url().includes("/mensagens") && req.method() === "POST",
      { timeout: 5000 },
    );
    expect(sendRequest.postDataJSON().content).toBe(
      "Nosso horário é das 6h às 22h!",
    );
  });

  test("cenário 4: mudar status da conversa para Encerrada", async ({
    page,
  }) => {
    // Selecionar conversa
    await page.getByText("Maria Silva").click();
    await expect(page).toHaveURL(/\/atendimento\/inbox\/conv-001/);

    // Verificar status atual
    await expect(page.getByText("Aberta")).toBeVisible();

    // Clicar no select de status e selecionar "Encerrada"
    await page
      .getByRole("combobox", { name: /status/i })
      .first()
      .click();
    await page.getByRole("option", { name: "Encerrada" }).click();

    // Verificar que a requisição PATCH foi feita
    const patchRequest = await page.waitForRequest(
      (req) => req.method() === "PATCH" && req.url().includes("/conversas"),
      { timeout: 5000 },
    );
    expect(patchRequest.postDataJSON().status).toBe("ENCERRADA");
  });

  test("cenário 5: filtros funcionam corretamente", async ({ page }) => {
    // Aplicar filtro de status "Aberta"
    await page
      .getByRole("combobox", { name: "Status" })
      .click();
    await page.getByRole("option", { name: "Aberta" }).click();

    // Verificar que a URL tem o filtro
    await expect(page).toHaveURL(/status=ABERTA/);

    // Aplicar filtro de busca
    const buscaInput = page.getByRole("textbox", { name: "Buscar" });
    await buscaInput.fill("Maria");
    await expect(page).toHaveURL(/busca=Maria/);

    // Limpar filtros
    await page.getByRole("button", { name: "Limpar filtros" }).click();

    // Verificar que os filtros foram removidos da URL
    await expect(page).not.toHaveURL(/status=/);
    await expect(page).not.toHaveURL(/busca=/);
  });

  test("cenário 6: empty state quando não há conversas", async ({
    page,
  }) => {
    // Sobrescrever mock para lista vazia
    await page.route("/api/v1/conversas**", async (route: Route) => {
      await fulfillJson(route,{
        content: [],
        pageable: { pageNumber: 0, pageSize: 20 },
        totalPages: 0,
        totalElements: 0,
        last: true,
        size: 20,
        number: 0,
        first: true,
        numberOfElements: 0,
        empty: true,
      });
    });

    await page.reload();

    // Verificar que o empty state aparece
    await expect(
      page.getByText(/nenhuma conversa/i),
    ).toBeVisible({ timeout: 5000 });
  });

  test("cenário 7: Enter envia mensagem, Shift+Enter insere nova linha", async ({
    page,
  }) => {
    // Selecionar conversa
    await page.getByText("Maria Silva").click();
    await expect(page).toHaveURL(/\/atendimento\/inbox\/conv-001/);

    const textarea = page.getByRole("textbox", { name: "Mensagem" });

    // Shift+Enter insere nova linha
    await textarea.fill("Linha 1");
    await textarea.press("Shift+Enter");
    await textarea.pressSequentially("Linha 2");

    // Verificar que há duas linhas no textarea
    const value = await textarea.inputValue();
    expect(value).toContain("Linha 1");
    expect(value).toContain("Linha 2");

    // Enter envia
    await textarea.press("Enter");

    // Verificar requisição
    await page.waitForRequest(
      (req) =>
        req.url().includes("/mensagens") && req.method() === "POST",
      { timeout: 5000 },
    );
  });
});
