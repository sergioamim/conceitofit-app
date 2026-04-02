import { expect, test, type Page, type Route } from "@playwright/test";
import { installE2EAuthSession } from "./support/auth-session";
import { installOperationalAppShellMocks } from "./support/protected-shell-mocks";

const TENANT = {
  id: "tenant-centro",
  nome: "Unidade Centro",
  ativo: true,
};

const DASHBOARD_RESPONSE = {
  totalAlunosAtivos: 128,
  prospectsNovos: 18,
  matriculasDoMes: 9,
  receitaDoMes: 54230,
  prospectsRecentes: [
    {
      id: "prospect-1",
      tenantId: TENANT.id,
      nome: "Ana Prospect",
      telefone: "11999990001",
      origem: "WHATSAPP",
      status: "NOVO",
      dataCriacao: "2026-03-30T10:00:00",
    },
    {
      id: "prospect-2",
      tenantId: TENANT.id,
      nome: "Bruno Lead",
      telefone: "11999990002",
      origem: "INSTAGRAM",
      status: "EM_CONTATO",
      dataCriacao: "2026-03-29T11:00:00",
    },
  ],
  matriculasVencendo: [
    {
      id: "mat-1",
      tenantId: TENANT.id,
      alunoId: "aluno-1",
      planoId: "plano-1",
      dataInicio: "2026-02-01",
      dataFim: "2026-04-05",
      status: "ATIVA",
      aluno: { id: "aluno-1", tenantId: TENANT.id, nome: "Carlos Ativo" },
      plano: { id: "plano-1", nome: "Plano Gold" },
    },
  ],
  pagamentosPendentes: [
    {
      id: "pag-1",
      tenantId: TENANT.id,
      alunoId: "aluno-1",
      valor: 299.9,
      valorFinal: 299.9,
      dataVencimento: "2026-03-28",
      status: "PENDENTE",
      aluno: { id: "aluno-1", tenantId: TENANT.id, nome: "Carlos Ativo" },
    },
  ],
  statusAlunoCount: {
    ATIVO: 128,
    INATIVO: 7,
    SUSPENSO: 3,
    CANCELADO: 1,
  },
  prospectsEmAberto: 11,
  followupPendente: 4,
  visitasAguardandoRetorno: 3,
  prospectsNovosAnterior: 14,
  matriculasDoMesAnterior: 7,
  receitaDoMesAnterior: 49800,
  ticketMedio: 312.4,
  ticketMedioAnterior: 301.2,
  pagamentosRecebidosMes: 49000,
  pagamentosRecebidosMesAnterior: 47250,
  vendasNovas: 15800,
  vendasRecorrentes: 38430,
  inadimplencia: 1880,
  aReceber: 6240,
};

async function fulfillJson(route: Route, json: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify(json),
  });
}

function normalizedPath(pathname: string) {
  return pathname.replace(/^\/backend/, "");
}

async function seedAuthenticatedSession(page: Page) {
  await installE2EAuthSession(page, {
    token: "token-dashboard",
    refreshToken: "refresh-dashboard",
    type: "Bearer",
    expiresIn: 3600,
    userId: "user-dashboard",
    userKind: "COLABORADOR",
    displayName: "Operador Dashboard",
    activeTenantId: TENANT.id,
    baseTenantId: TENANT.id,
    availableTenants: [{ tenantId: TENANT.id, defaultTenant: true }],
    availableScopes: ["UNIDADE"],
    broadAccess: false,
  });
}

async function installDashboardMocks(page: Page) {
  await installOperationalAppShellMocks(page, {
    currentTenantId: TENANT.id,
    tenants: [
      {
        ...TENANT,
        academiaId: "academia-1",
        groupId: "academia-1",
      },
    ],
    user: {
      userId: "user-dashboard",
      nome: "Operador Dashboard",
      displayName: "Operador Dashboard",
      email: "dashboard@teste.local",
      roles: ["ADMIN"],
      userKind: "COLABORADOR",
      activeTenantId: TENANT.id,
      tenantBaseId: TENANT.id,
      availableScopes: ["UNIDADE"],
      broadAccess: false,
    },
    academia: {
      id: "academia-1",
      nome: "Academia Teste",
      ativo: true,
    },
    capabilities: {
      canAccessElevatedModules: true,
      canDeleteClient: false,
    },
  });

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const path = normalizedPath(url.pathname);

    if (path === "/api/v1/academia/dashboard" && method === "GET") {
      await fulfillJson(route, DASHBOARD_RESPONSE);
      return;
    }
    if (path === "/api/v1/comercial/pagamentos" && method === "GET") {
      await fulfillJson(route, DASHBOARD_RESPONSE.pagamentosPendentes);
      return;
    }
    if (
      (path === "/api/v1/comercial/alunos"
        || path === "/api/v1/matriculas"
        || path === "/api/v1/formas-pagamento"
        || path === "/api/v1/beneficios/convenios")
      && method === "GET"
    ) {
      await fulfillJson(route, []);
      return;
    }
    if (path === "/api/v1/admin-financeiro/nfse-config" && method === "GET") {
      await fulfillJson(route, {
        status: "CONFIGURADO",
        provider: "MOCK",
        ambiente: "HOMOLOGACAO",
      });
      return;
    }
    await route.fallback();
  });
}

test.describe("Dashboard principal", () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthenticatedSession(page);
    await installDashboardMocks(page);
  });

  test("renderiza cards, prospects, matrículas e pagamentos com dados mockados", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByTestId("alunos-ativos-card")).toContainText("128");

    await expect(page.getByRole("heading", { name: "Prospects recentes" })).toBeVisible();
    await expect(page.getByText("Ana Prospect")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Matrículas vencendo em 7 dias" })).toBeVisible();
    await expect(page.getByText("Carlos Ativo")).toBeVisible();

    await page.getByRole("button", { name: "Vendas" }).click();
    await expect(page.getByTestId("matriculas-card")).toContainText("9");
    await expect(page.getByTestId("receita-card")).toContainText("R$");

    await page.getByRole("button", { name: "Financeiro" }).click();
    await expect(page.getByText("Recebimentos do mês")).toBeVisible();
    await expect(page.locator("h2", { hasText: "Pagamentos pendentes e vencidos" })).toBeVisible();
    await expect(page.getByText("R$ 299,90")).toBeVisible();
  });

  test("navega para prospects e pagamentos a partir do dashboard", async ({ page }) => {
    await page.goto("/dashboard");

    await page.getByTestId("prospects-recentes-link").click();
    await expect(page).toHaveURL(/\/prospects$/);

    await seedAuthenticatedSession(page);
    await installDashboardMocks(page);
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Financeiro" }).click();
    await expect(page.getByText("Recebimentos do mês")).toBeVisible();
    await page.getByRole("link", { name: "Ver todos" }).click();
    await expect(page).toHaveURL(/\/pagamentos$/);
  });
});
