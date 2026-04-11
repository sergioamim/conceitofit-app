import { expect, test, type Page } from "@playwright/test";
import {
  installGerencialCommonMocks,
  seedGerencialSession,
} from "./support/gerencial-auth";

const TENANT_ID = "tenant-gerencial-e2e";

type AssinaturaMock = {
  id: string;
  tenantId: string;
  alunoId: string;
  planoId: string;
  clienteNome?: string;
  planoNome?: string;
  status: "ATIVA" | "PENDENTE" | "CANCELADA" | "SUSPENSA" | "VENCIDA";
  valor: number;
  ciclo: "MENSAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL";
  dataInicio: string;
  proximaCobranca?: string;
};

function buildAssinatura(
  overrides: Partial<AssinaturaMock> = {},
): AssinaturaMock {
  return {
    id: "ass-1",
    tenantId: TENANT_ID,
    alunoId: "aluno-1",
    planoId: "plano-1",
    clienteNome: "Maria Silva",
    planoNome: "Plano Black",
    status: "ATIVA",
    valor: 150,
    ciclo: "MENSAL",
    dataInicio: "2026-01-01",
    proximaCobranca: "2026-05-01",
    ...overrides,
  };
}

async function installBillingDashboardMocks(
  page: Page,
  options: {
    assinaturas?: AssinaturaMock[];
    assinaturasStatus?: number;
  } = {},
) {
  // GET /api/v1/billing/assinaturas
  await page.route(/\/api\/v1\/billing\/assinaturas(\?|$)/, async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    if (options.assinaturasStatus && options.assinaturasStatus !== 200) {
      return route.fulfill({
        status: options.assinaturasStatus,
        contentType: "application/json",
        body: JSON.stringify({ message: "unavailable" }),
      });
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(options.assinaturas ?? []),
    });
  });

  // Billing config vazia (a página do dashboard não exige config)
  await page.route(/\/api\/v1\/billing\/config(\?|$)/, async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ message: "not found" }),
    });
  });
}

async function openBillingDashboard(page: Page) {
  await installGerencialCommonMocks(page, { tenantId: TENANT_ID });
  await seedGerencialSession(page, { tenantId: TENANT_ID });
  await page.goto("/administrativo/billing/dashboard", {
    waitUntil: "domcontentloaded",
  });
}

test.describe("Billing — Dashboard de Cobranças Recorrentes", () => {
  test("cenário 1: renderiza header e KPIs principais", async ({ page }) => {
    await installBillingDashboardMocks(page, {
      assinaturas: [
        buildAssinatura({ id: "a1", status: "ATIVA", valor: 150 }),
        buildAssinatura({
          id: "a2",
          alunoId: "aluno-2",
          clienteNome: "João Santos",
          status: "ATIVA",
          valor: 200,
        }),
        buildAssinatura({
          id: "a3",
          alunoId: "aluno-3",
          clienteNome: "Ana Lima",
          status: "CANCELADA",
          valor: 150,
        }),
      ],
    });
    await openBillingDashboard(page);

    await expect(
      page.getByRole("heading", { name: /Dashboard de/ }),
    ).toBeVisible();
    // Usamos as descrições dos KPIs como âncora — labels curtas podem
    // sofrer colisão com outros elementos no DOM.
    await expect(page.getByText(/Receita recorrente mensal/)).toBeVisible();
    await expect(page.getByText(/Projeção anualizada/)).toBeVisible();
    await expect(
      page.getByText(/Assinaturas canceladas/, { exact: false }),
    ).toBeVisible();
  });

  test("cenário 2: MRR calculado corretamente (2 ativas = 350)", async ({
    page,
  }) => {
    await installBillingDashboardMocks(page, {
      assinaturas: [
        buildAssinatura({ id: "a1", status: "ATIVA", valor: 150 }),
        buildAssinatura({ id: "a2", status: "ATIVA", valor: 200 }),
      ],
    });
    await openBillingDashboard(page);

    // MRR = 350, ARR = 4200, Ticket médio = 175
    await expect(page.getByText(/R\$\s*350,00/).first()).toBeVisible();
    await expect(page.getByText(/R\$\s*4\.200,00/).first()).toBeVisible();
    await expect(page.getByText(/R\$\s*175,00/).first()).toBeVisible();
  });

  test("cenário 3: churn rate aparece quando há cancelamentos", async ({
    page,
  }) => {
    await installBillingDashboardMocks(page, {
      assinaturas: [
        buildAssinatura({ id: "a1", status: "ATIVA" }),
        buildAssinatura({ id: "a2", status: "ATIVA" }),
        buildAssinatura({ id: "a3", status: "ATIVA" }),
        buildAssinatura({ id: "a4", status: "CANCELADA" }),
      ],
    });
    await openBillingDashboard(page);

    // Churn = 1/(1+3) = 25%
    await expect(page.getByText("Churn rate")).toBeVisible();
    await expect(page.getByText(/25,0%/).first()).toBeVisible();
  });

  test("cenário 4: tabela lista assinaturas com status", async ({ page }) => {
    await installBillingDashboardMocks(page, {
      assinaturas: [
        buildAssinatura({
          id: "a1",
          clienteNome: "Maria Silva",
          planoNome: "Plano Black",
          status: "ATIVA",
          valor: 150,
        }),
        buildAssinatura({
          id: "a2",
          alunoId: "aluno-2",
          clienteNome: "João Santos",
          planoNome: "Plano Gold",
          status: "VENCIDA",
          valor: 100,
        }),
      ],
    });
    await openBillingDashboard(page);

    await expect(page.getByText("Maria Silva")).toBeVisible();
    await expect(page.getByText("João Santos")).toBeVisible();
    await expect(page.getByText("Plano Black")).toBeVisible();
    await expect(page.getByText("Plano Gold")).toBeVisible();
  });

  test("cenário 5: backend fantasma (404) mostra estado vazio amigável", async ({
    page,
  }) => {
    await installBillingDashboardMocks(page, { assinaturasStatus: 404 });
    await openBillingDashboard(page);

    await expect(
      page.getByRole("heading", { name: /Dashboard de/ }),
    ).toBeVisible();
    await expect(
      page.getByText(/Sem assinaturas ativas|backend ainda não expõe/i),
    ).toBeVisible();
  });

  test("cenário 6: breakdown por status mostra 5 categorias", async ({
    page,
  }) => {
    await installBillingDashboardMocks(page, {
      assinaturas: [
        buildAssinatura({ id: "a1", status: "ATIVA" }),
        buildAssinatura({ id: "a2", status: "PENDENTE" }),
        buildAssinatura({ id: "a3", status: "CANCELADA" }),
        buildAssinatura({ id: "a4", status: "SUSPENSA" }),
        buildAssinatura({ id: "a5", status: "VENCIDA" }),
      ],
    });
    await openBillingDashboard(page);

    await expect(page.getByText("Distribuição por status")).toBeVisible();
    // Os 5 badges de status devem estar presentes
    await expect(page.getByText("Ativa", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Pendente", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Cancelada", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Suspensa", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Vencida", { exact: true }).first()).toBeVisible();
  });
});
