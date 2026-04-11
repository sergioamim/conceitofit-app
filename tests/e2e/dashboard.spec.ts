import { expect, test, type Page, type Route } from "@playwright/test";
import { installE2EAuthSession } from "./support/auth-session";
import { createBrowserErrorGuard } from "./support/browser-errors";
import { installOperationalAppShellMocks } from "./support/protected-shell-mocks";
import {
  enableAuthenticatedSSRForPlaywright,
  overrideLegacyActiveTenantCookie,
} from "./support/ssr-runtime";

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

const FUNCIONARIOS_RESPONSE = [
  {
    id: "func-1",
    tenantId: TENANT.id,
    nome: "Operador Dashboard",
    email: "dashboard@teste.local",
    telefone: "11999990000",
    cargo: "Consultor",
    ativo: true,
  },
];

const FORMAS_PAGAMENTO_RESPONSE = [
  {
    id: "fp-pix",
    tenantId: TENANT.id,
    nome: "PIX",
    tipo: "PIX",
    ativo: true,
    taxaPercentual: 0,
    parcelasMax: 1,
    emitirAutomaticamente: false,
  },
];

const ALUNOS_RESPONSE = {
  content: [
    {
      id: "aluno-1",
      tenantId: TENANT.id,
      nome: "Carlos Ativo",
      email: "carlos@teste.local",
      cpf: "12345678901",
      telefone: "11999990003",
      status: "ATIVO",
      dataCadastro: "2026-02-01T10:00:00",
    },
  ],
  page: {
    number: 0,
    size: 500,
    totalElements: 1,
    totalPages: 1,
  },
};

const MATRICULAS_RESPONSE = [
  {
    id: "mat-1",
    tenantId: TENANT.id,
    alunoId: "aluno-1",
    planoId: "plano-1",
    convenioId: null,
    dataInicio: "2026-02-01",
    dataFim: "2026-04-05",
    status: "ATIVA",
    aluno: { id: "aluno-1", tenantId: TENANT.id, nome: "Carlos Ativo" },
    plano: { id: "plano-1", nome: "Plano Gold" },
  },
];

const CONVENIOS_RESPONSE: unknown[] = [];

const NFSE_CONFIGURACAO_RESPONSE = {
  tenantId: TENANT.id,
  ambiente: "HOMOLOGACAO",
  provedor: "",
  prefeitura: "",
  inscricaoMunicipal: "",
  cnaePrincipal: "",
  codigoTributacaoNacional: "",
  codigoNbs: "",
  classificacaoTributaria: "MEI",
  consumidorFinal: true,
  indicadorOperacao: "SERVICO_MUNICIPAL",
  serieRps: "1",
  loteInicial: 1,
  aliquotaPadrao: 0,
  regimeTributario: "SIMPLES_NACIONAL",
  emissaoAutomatica: false,
  emailCopiaFinanceiro: "",
  certificadoAlias: "",
  webhookFiscalUrl: "",
};

const PAGAMENTOS_RESPONSE = [
  {
    id: "cr-1",
    tenantId: TENANT.id,
    cliente: "Carlos Ativo",
    documentoCliente: "12345678901",
    descricao: "Mensalidade Março",
    categoria: "MENSALIDADE",
    competencia: "2026-03",
    dataEmissao: "2026-03-01",
    dataVencimento: "2026-03-28",
    dataRecebimento: null,
    valorOriginal: 299.9,
    desconto: 0,
    jurosMulta: 0,
    valorRecebido: null,
    formaPagamento: null,
    status: "PENDENTE",
    geradaAutomaticamente: true,
    origemLancamento: "RECORRENTE",
    observacoes: null,
    dataCriacao: "2026-03-01T10:00:00",
    dataAtualizacao: "2026-03-01T10:00:00",
  },
];

const PROSPECTS_RESPONSE = {
  content: DASHBOARD_RESPONSE.prospectsRecentes,
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

async function installDashboardMocks(page: Page, options: { mockDashboardApi?: boolean } = {}) {
  const mockDashboardApi = options.mockDashboardApi ?? true;

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

    if (mockDashboardApi && path === "/api/v1/academia/dashboard" && method === "GET") {
      await fulfillJson(route, DASHBOARD_RESPONSE);
      return;
    }
    if (path === "/api/v1/comercial/pagamentos" && method === "GET") {
      await fulfillJson(route, DASHBOARD_RESPONSE.pagamentosPendentes);
      return;
    }
    if (path === "/api/v1/academia/prospects" && method === "GET") {
      await fulfillJson(route, PROSPECTS_RESPONSE);
      return;
    }
    if (path === "/api/v1/administrativo/funcionarios" && method === "GET") {
      await fulfillJson(route, FUNCIONARIOS_RESPONSE);
      return;
    }
    if (path === "/api/v1/gerencial/financeiro/contas-receber" && method === "GET") {
      await fulfillJson(route, PAGAMENTOS_RESPONSE);
      return;
    }
    if (path === "/api/v1/gerencial/financeiro/formas-pagamento" && method === "GET") {
      await fulfillJson(route, FORMAS_PAGAMENTO_RESPONSE);
      return;
    }
    if (path === "/api/v1/comercial/alunos" && method === "GET") {
      await fulfillJson(route, ALUNOS_RESPONSE);
      return;
    }
    if (
      (path === "/api/v1/comercial/adesoes"
        || path === "/api/v1/comercial/matriculas"
        || path === "/api/v1/matriculas")
      && method === "GET"
    ) {
      await fulfillJson(route, MATRICULAS_RESPONSE);
      return;
    }
    if (path === "/api/v1/administrativo/convenios" && method === "GET") {
      await fulfillJson(route, CONVENIOS_RESPONSE);
      return;
    }
    if (path === "/api/v1/formas-pagamento" && method === "GET") {
      await fulfillJson(route, FORMAS_PAGAMENTO_RESPONSE);
      return;
    }
    if (path === "/api/v1/beneficios/convenios" && method === "GET") {
      await fulfillJson(route, CONVENIOS_RESPONSE);
      return;
    }
    if (
      (path === "/api/v1/administrativo/nfse/configuracao-atual"
        || path === "/api/v1/admin-financeiro/nfse-config")
      && method === "GET"
    ) {
      await fulfillJson(route, NFSE_CONFIGURACAO_RESPONSE);
      return;
    }
    await route.fallback();
  });
}

test.describe("Dashboard principal", () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthenticatedSession(page);
  });

  test("renderiza cards, prospects, matrículas e pagamentos com dados mockados", async ({ page }) => {
    const browserErrors = createBrowserErrorGuard(page);
    const main = page.locator("main");

    await installDashboardMocks(page);
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(main.getByText("Clientes ativos")).toBeVisible();
    await expect(main.getByRole("heading", { level: 3, name: "128" })).toBeVisible();

    await expect(main.getByRole("heading", { name: "Prospects recentes" })).toBeVisible();
    await expect(main.getByText("Ana Prospect")).toBeVisible();
    await expect(main.getByRole("heading", { name: "Matrículas vencendo" })).toBeVisible();
    await expect(main.getByText("Carlos Ativo")).toBeVisible();

    await main.getByRole("button", { name: "Vendas" }).click();
    await expect(main.getByText("Contratos vendidos")).toBeVisible();
    await expect(main.getByRole("heading", { level: 3, name: "9" })).toBeVisible();
    await expect(main.getByText("Valor total vendido")).toBeVisible();

    await main.getByRole("button", { name: "Financeiro" }).click();
    await expect(main.getByText("Recebimentos")).toBeVisible();
    await expect(main.getByRole("heading", { name: "Pendentes e Vencidos" })).toBeVisible();
    await expect(main.getByText("R$ 299,90")).toBeVisible();
    await browserErrors.assertNoUnexpectedErrors("Happy path do dashboard emitiu erro no browser");
  });

  test("navega para prospects e pagamentos a partir do dashboard", async ({ page }) => {
    const browserErrors = createBrowserErrorGuard(page);
    const main = page.locator("main");

    await installDashboardMocks(page);
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

    await expect(main.getByRole("link", { name: /Ver pipeline/i })).toHaveAttribute("href", "/prospects");
    await page.goto("/prospects", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/prospects$/);

    await seedAuthenticatedSession(page);
    await installDashboardMocks(page);
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await main.getByRole("button", { name: "Financeiro" }).click();
    await expect(main.getByText("Recebimentos")).toBeVisible();
    await expect(main.locator('a[href="/pagamentos"]').filter({ hasText: "Ver todos" })).toHaveAttribute("href", "/pagamentos");
    await page.goto("/pagamentos", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/pagamentos$/);
    await browserErrors.assertNoUnexpectedErrors("Navegação happy path do dashboard emitiu erro no browser");
  });

  test("usa SSR autenticado com claims canônicas mesmo quando o cookie legado está stale", async ({ page }) => {
    const browserErrors = createBrowserErrorGuard(page);
    const main = page.locator("main");
    let dashboardClientRequests = 0;

    await installDashboardMocks(page, { mockDashboardApi: false });
    await enableAuthenticatedSSRForPlaywright(page);
    await overrideLegacyActiveTenantCookie(page, "tenant-legado-stale");

    await page.route("**/api/v1/academia/dashboard**", async (route) => {
      dashboardClientRequests += 1;
      await fulfillJson(route, DASHBOARD_RESPONSE);
    });

    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(main.getByText("Clientes ativos")).toBeVisible();
    await expect(main.getByRole("heading", { level: 3, name: "77" })).toBeVisible();
    await expect(main.getByText("Prospect SSR")).toBeVisible();

    await page.waitForTimeout(500);
    expect(dashboardClientRequests).toBe(0);
    await browserErrors.assertNoUnexpectedErrors("Dashboard SSR happy path emitiu erro no browser");
  });
});
