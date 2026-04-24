import { expect, test, type Page } from "@playwright/test";
import {
  installGerencialCommonMocks,
  seedGerencialSession,
} from "./support/gerencial-auth";

/**
 * Epic 3 — Wave 6 Story 3.22 (D9 golden path).
 *
 * Cenário completo da tela `/crm/cadencias`:
 *   1. Operador autenticado navega para a tela.
 *   2. Cria cadência com 2 passos via drawer.
 *   3. Card novo aparece na lista.
 *   4. Dispara a cadência para um prospect.
 *   5. Navega para a aba "Execuções" e confirma a execução em andamento.
 *
 * Toda a interação bate em stubs Playwright (estado mantido em memória dentro
 * da spec) — não há dependência de backend Java ou banco. Para rodar:
 *   npx playwright test cadencias-golden-path
 */

const TENANT_ID = "tenant-gerencial-e2e";
const PROSPECT_ID = "prospect-e2e-1";
const PROSPECT_NOME = "Prospect E2E";
const CADENCIA_NOME = "Cadência E2E Test";
const CADENCIA_OBJETIVO = "Teste automatizado golden path";

type CadenciaStubPasso = {
  id: string;
  titulo: string;
  acao: "WHATSAPP" | "EMAIL" | "LIGACAO" | "TAREFA_INTERNA";
  delayDias: number;
  template?: string;
  automatica: boolean;
};

type CadenciaStub = {
  id: string;
  tenantId: string;
  nome: string;
  objetivo: string;
  gatilho: string;
  stageStatus: string;
  ativo: boolean;
  passos: CadenciaStubPasso[];
  dataCriacao: string;
};

type ExecucaoStub = {
  id: string;
  tenantId: string;
  cadenciaId: string;
  cadenciaNome: string;
  prospectId: string;
  prospectNome: string;
  stageStatus: string;
  status: "EM_ANDAMENTO" | "CONCLUIDA" | "CANCELADA" | "ESCALADA";
  iniciadoEm: string;
  passos: Array<{
    id: string;
    stepId: string;
    stepTitulo: string;
    acao: CadenciaStubPasso["acao"];
    status: "PENDENTE" | "EXECUTADO" | "PULADO" | "FALHA";
    agendadoPara: string;
    executadoEm?: string;
  }>;
};

/**
 * Instala mocks com estado compartilhado entre requests. Precisa ser chamado
 * antes da navegação para que a tela já encontre o mock instalado.
 */
async function installStatefulCrmCadenciasMocks(page: Page) {
  const state = {
    cadencias: [] as CadenciaStub[],
    execucoes: [] as ExecucaoStub[],
    seq: 1,
  };

  // GET /api/v1/crm/cadencias?tenantId=...
  await page.route(/\/api\/v1\/crm\/cadencias(\?|$)/, async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(state.cadencias),
      });
      return;
    }
    if (method === "POST") {
      const body = JSON.parse(route.request().postData() ?? "{}") as {
        nome: string;
        objetivo: string;
        gatilho: string;
        stageStatus: string;
        ativo: boolean;
        passos: Array<Omit<CadenciaStubPasso, "id">>;
      };
      const id = `cad-${state.seq++}`;
      const now = "2026-04-24T10:00:00Z";
      const cadencia: CadenciaStub = {
        id,
        tenantId: TENANT_ID,
        nome: body.nome,
        objetivo: body.objetivo,
        gatilho: body.gatilho,
        stageStatus: body.stageStatus,
        ativo: body.ativo,
        passos: body.passos.map((p, idx) => ({
          id: `${id}-p${idx + 1}`,
          titulo: p.titulo,
          acao: p.acao,
          delayDias: p.delayDias,
          template: p.template,
          automatica: p.automatica,
        })),
        dataCriacao: now,
      };
      state.cadencias.push(cadencia);
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(cadencia),
      });
      return;
    }
    await route.fallback();
  });

  // GET /api/v1/crm/cadencias/execucoes?tenantId=...
  await page.route(
    /\/api\/v1\/crm\/cadencias\/execucoes(\?|$)/,
    async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(state.execucoes),
      });
    },
  );

  // POST /api/v1/crm/cadencias/trigger
  await page.route(/\/api\/v1\/crm\/cadencias\/trigger/, async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    const body = JSON.parse(route.request().postData() ?? "{}") as {
      cadenciaId: string;
      prospectId: string;
    };
    const cadencia = state.cadencias.find((c) => c.id === body.cadenciaId);
    if (!cadencia) {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ message: "Cadência não encontrada" }),
      });
      return;
    }
    const execId = `exec-${state.seq++}`;
    const now = "2026-04-24T10:05:00Z";
    const execucao: ExecucaoStub = {
      id: execId,
      tenantId: TENANT_ID,
      cadenciaId: cadencia.id,
      cadenciaNome: cadencia.nome,
      prospectId: body.prospectId,
      prospectNome: PROSPECT_NOME,
      stageStatus: cadencia.stageStatus,
      status: "EM_ANDAMENTO",
      iniciadoEm: now,
      passos: cadencia.passos.map((p, idx) => ({
        id: `${execId}-p${idx + 1}`,
        stepId: p.id,
        stepTitulo: p.titulo,
        acao: p.acao,
        status: "PENDENTE" as const,
        agendadoPara: now,
      })),
    };
    state.execucoes.push(execucao);
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify(execucao),
    });
  });

  // GET /api/v1/crm/cadencias/escalation-rules
  await page.route(
    /\/api\/v1\/crm\/cadencias\/escalation-rules/,
    async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    },
  );

  // GET /api/v1/academia/prospects (usado pelo trigger modal)
  await page.route(/\/api\/v1\/academia\/prospects/, async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: PROSPECT_ID,
          tenantId: TENANT_ID,
          nome: PROSPECT_NOME,
          telefone: "(11) 99999-0001",
          origem: "SITE",
          status: "NOVO",
          dataCriacao: "2026-04-20T10:00:00Z",
        },
      ]),
    });
  });
}

async function abrirTelaCadencias(page: Page) {
  await installGerencialCommonMocks(page, { tenantId: TENANT_ID });
  await seedGerencialSession(page, { tenantId: TENANT_ID });
  await installStatefulCrmCadenciasMocks(page);
  await page.goto("/crm/cadencias", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: /Cadências/ }).first(),
  ).toBeVisible();
  // Aguarda o estado inicial de "0 cadências" renderizar (confirma que o load
  // completou — evita corridas com o clique em "Nova cadência").
  await expect(
    page.getByText("Nenhuma cadência configurada.", { exact: false }),
  ).toBeVisible();
}

test.describe("CRM — Cadências golden path (Epic 3 D9)", () => {
  test("cria cadência, dispara para prospect e valida execução na aba", async ({
    page,
  }) => {
    await abrirTelaCadencias(page);

    // --- 1. Abre drawer de nova cadência ---
    await page.getByRole("button", { name: /Nova cadência/i }).click();

    // Sheet é portalizado e usa role=dialog. Aguardamos explicitamente ficar
    // visível antes de qualquer asserção interna — o primeiro clique às vezes
    // perde a animação de entrada sem o wait.
    const drawer = page.locator('[role="dialog"][data-state="open"]');
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText(/Nova cadência/i).first()).toBeVisible();

    // --- 2. Preenche dados principais ---
    await drawer.locator("#cadencia-nome").fill(CADENCIA_NOME);
    await drawer.locator("#cadencia-objetivo").fill(CADENCIA_OBJETIVO);

    // Gatilho + Stage status já vêm com os defaults NOVO_PROSPECT e NOVO; ativo=true.
    // Garantimos que o switch "ativa" está ligado (default true).
    await expect(drawer.locator("#cadencia-ativo")).toBeVisible();

    // --- 3. Preenche Passo 1 (já existe por default) ---
    await drawer.locator("#passo-0-titulo").fill("WhatsApp de boas-vindas");
    // Ação default é WHATSAPP → ok. DelayDias=0 default.
    // Marca "Executar automaticamente".
    await drawer.locator("#passo-0-automatica").click();

    // --- 4. Adiciona Passo 2 ---
    await drawer.getByRole("button", { name: /Adicionar passo/i }).click();
    await drawer.locator("#passo-1-titulo").fill("Ligação follow-up");

    // Troca ação para LIGACAO via Select (Radix)
    const passo2AcaoCombobox = drawer
      .getByRole("combobox")
      .filter({ hasText: /WhatsApp/i })
      .last();
    await passo2AcaoCombobox.click();
    await page.getByRole("option", { name: /Ligação/i }).click();

    // delayDias = 2
    await drawer.locator("#passo-1-delay").fill("2");

    // --- 5. Salva ---
    const createResponse = page.waitForResponse(
      (r) =>
        r.request().method() === "POST" &&
        /\/api\/v1\/crm\/cadencias(\?|$)/.test(r.url()),
    );
    await drawer.getByRole("button", { name: /Criar cadência/i }).click();
    await createResponse;

    // Drawer fecha.
    await expect(drawer).toBeHidden();

    // --- 6. Card aparece na lista ---
    // CardTitle é renderizado como <div data-slot="card-title">, não <h*>.
    const cardTitle = page
      .locator('[data-slot="card-title"]', { hasText: CADENCIA_NOME })
      .first();
    await expect(cardTitle).toBeVisible();
    await expect(page.getByText("2 passo(s)").first()).toBeVisible();

    // --- 7. Clica "Disparar" no card ---
    const cardCadencia = cardTitle.locator(
      'xpath=ancestor::*[@data-slot="card"][1]',
    );
    await cardCadencia.getByRole("button", { name: /Disparar/i }).click();

    // --- 8. Modal de trigger abre, escolhe prospect ---
    const triggerDialog = page
      .getByRole("dialog")
      .filter({ hasText: /Disparar cadência manualmente/i });
    await expect(triggerDialog).toBeVisible();

    await triggerDialog.getByRole("combobox").click();
    await page
      .getByRole("option", { name: new RegExp(PROSPECT_NOME, "i") })
      .click();

    const triggerResponse = page.waitForResponse(
      (r) =>
        r.request().method() === "POST" &&
        /\/api\/v1\/crm\/cadencias\/trigger/.test(r.url()),
    );
    await triggerDialog.getByRole("button", { name: /^Disparar$/ }).click();
    await triggerResponse;

    // Dialog fecha.
    await expect(triggerDialog).toBeHidden();

    // --- 9. Aba "Execuções" ativa e mostra execução ---
    // A página troca `activeTab` para "execucoes" via onTriggered.
    const tabExecucoes = page.getByRole("tab", { name: /Execuções/i });
    await expect(tabExecucoes).toHaveAttribute("data-state", "active");

    // Card de execução deve exibir o nome da cadência e o status "Em andamento".
    const execucaoCardTitle = page
      .locator('[data-slot="card-title"]', { hasText: CADENCIA_NOME })
      .first();
    await expect(execucaoCardTitle).toBeVisible();
    const execucaoCard = execucaoCardTitle.locator(
      'xpath=ancestor::*[@data-slot="card"][1]',
    );
    await expect(execucaoCard.getByText(PROSPECT_NOME)).toBeVisible();
    await expect(execucaoCard.getByText(/Em andamento/i)).toBeVisible();
  });
});
