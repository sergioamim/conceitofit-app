import { expect, test, type Page, type Route } from "@playwright/test";
import { applyE2EAuthSession } from "./support/auth-session";
import { installOperationalAppShellMocks } from "./support/protected-shell-mocks";

const TENANT_MANANCIAIS = {
  id: "tenant-mananciais-s1",
  academiaId: "academia-sergio-amim",
  groupId: "academia-sergio-amim",
  nome: "MANANCIAIS - S1",
  ativo: true,
};

const TENANT_PECHINCHA = {
  id: "tenant-pechincha-s3",
  academiaId: "academia-sergio-amim",
  groupId: "academia-sergio-amim",
  nome: "PECHINCHA - S3",
  ativo: true,
};

const ACADEMIA = {
  id: "academia-sergio-amim",
  nome: "Academia Sergio Amim",
  ativo: true,
};

async function fulfillJson(route: Route, json: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify(json),
  });
}

function normalizePath(pathname: string) {
  return pathname.replace(/^\/backend/, "");
}

async function installBiApiMocks(page: Page) {
  await installOperationalAppShellMocks(page, {
    currentTenantId: TENANT_MANANCIAIS.id,
    tenants: [TENANT_MANANCIAIS, TENANT_PECHINCHA],
    user: {
      id: "user-admin",
      userId: "user-admin",
      nome: "Admin BI",
      displayName: "Admin BI",
      email: "admin@academia.local",
      roles: ["OWNER", "ADMIN"],
      userKind: "COLABORADOR",
      activeTenantId: TENANT_MANANCIAIS.id,
      availableTenants: [
        { tenantId: TENANT_MANANCIAIS.id, defaultTenant: true },
        { tenantId: TENANT_PECHINCHA.id, defaultTenant: false },
      ],
      availableScopes: ["UNIDADE"],
      broadAccess: false,
      redeId: ACADEMIA.id,
      redeNome: ACADEMIA.nome,
      redeSlug: "academia-sergio-amim",
    },
    academia: ACADEMIA,
    capabilities: { canAccessElevatedModules: true, canDeleteClient: false },
  });

  const prospectsByTenant = {
    [TENANT_MANANCIAIS.id]: [
      {
        id: "prospect-mananciais-1",
        tenantId: TENANT_MANANCIAIS.id,
        nome: "João Silva",
        telefone: "(21) 99999-0001",
        email: "joao@test.local",
        origem: "WHATSAPP",
        status: "NOVO",
        dataCriacao: "2026-03-01T10:00:00",
      },
    ],
    [TENANT_PECHINCHA.id]: [
      {
        id: "prospect-pechincha-1",
        tenantId: TENANT_PECHINCHA.id,
        nome: "Ana Rocha",
        telefone: "(21) 99999-0003",
        email: "ana@test.local",
        origem: "SITE",
        status: "NOVO",
        dataCriacao: "2026-03-03T14:30:00",
      },
    ],
  } as const;

  const alunosByTenant = {
    [TENANT_MANANCIAIS.id]: [
      {
        id: "aluno-mananciais-1",
        tenantId: TENANT_MANANCIAIS.id,
        nome: "Maria Santos",
        email: "maria@test.local",
        telefone: "(21) 99999-0002",
        cpf: "11111111111",
        dataNascimento: "1995-01-01",
        sexo: "F",
        status: "ATIVO",
        dataCadastro: "2026-01-15",
      },
    ],
    [TENANT_PECHINCHA.id]: [
      {
        id: "aluno-pechincha-1",
        tenantId: TENANT_PECHINCHA.id,
        nome: "Carlos Lima",
        email: "carlos@test.local",
        telefone: "(21) 98888-0004",
        cpf: "22222222222",
        dataNascimento: "1992-04-18",
        sexo: "M",
        status: "ATIVO",
        dataCadastro: "2026-02-10",
      },
    ],
  } as const;

  const matriculasByTenant = {
    [TENANT_MANANCIAIS.id]: [
      {
        id: "mat-mananciais-1",
        tenantId: TENANT_MANANCIAIS.id,
        alunoId: "aluno-mananciais-1",
        planoId: "plano-1",
        dataInicio: "2026-01-15",
        dataFim: "2026-12-31",
        valorPago: 189.9,
        valorMatricula: 59.9,
        desconto: 0,
        formaPagamento: "PIX",
        status: "ATIVA",
        renovacaoAutomatica: true,
        dataCriacao: "2026-01-15",
      },
    ],
    [TENANT_PECHINCHA.id]: [
      {
        id: "mat-pechincha-1",
        tenantId: TENANT_PECHINCHA.id,
        alunoId: "aluno-pechincha-1",
        planoId: "plano-2",
        dataInicio: "2026-02-10",
        dataFim: "2026-12-31",
        valorPago: 209.9,
        valorMatricula: 49.9,
        desconto: 10,
        formaPagamento: "CARTAO_CREDITO",
        status: "ATIVA",
        renovacaoAutomatica: true,
        dataCriacao: "2026-02-10",
      },
    ],
  } as const;

  const contasReceberByTenant = {
    [TENANT_MANANCIAIS.id]: [
      {
        id: "cr-mananciais-pago",
        tenantId: TENANT_MANANCIAIS.id,
        cliente: "Maria Santos",
        descricao: "Mensalidade Março",
        categoria: "MENSALIDADE",
        competencia: "2026-03-01",
        dataVencimento: "2026-03-10",
        dataRecebimento: "2026-03-10",
        valorOriginal: 189.9,
        desconto: 0,
        jurosMulta: 0,
        status: "RECEBIDA",
        dataCriacao: "2026-03-01T08:00:00",
      },
      {
        id: "cr-mananciais-pendente",
        tenantId: TENANT_MANANCIAIS.id,
        cliente: "Maria Santos",
        descricao: "Mensalidade Abril",
        categoria: "MENSALIDADE",
        competencia: "2026-04-01",
        dataVencimento: "2026-04-10",
        valorOriginal: 189.9,
        desconto: 0,
        jurosMulta: 0,
        status: "PENDENTE",
        dataCriacao: "2026-04-01T08:00:00",
      },
      {
        id: "cr-mananciais-vencido",
        tenantId: TENANT_MANANCIAIS.id,
        cliente: "Maria Santos",
        descricao: "Mensalidade Fevereiro",
        categoria: "MENSALIDADE",
        competencia: "2026-02-01",
        dataVencimento: "2026-02-10",
        valorOriginal: 189.9,
        desconto: 0,
        jurosMulta: 12,
        status: "VENCIDA",
        dataCriacao: "2026-02-01T08:00:00",
      },
    ],
    [TENANT_PECHINCHA.id]: [
      {
        id: "cr-pechincha-pago",
        tenantId: TENANT_PECHINCHA.id,
        cliente: "Carlos Lima",
        descricao: "Mensalidade Março",
        categoria: "MENSALIDADE",
        competencia: "2026-03-01",
        dataVencimento: "2026-03-08",
        dataRecebimento: "2026-03-08",
        valorOriginal: 209.9,
        desconto: 5,
        jurosMulta: 0,
        status: "RECEBIDA",
        dataCriacao: "2026-03-02T08:30:00",
      },
      {
        id: "cr-pechincha-pendente",
        tenantId: TENANT_PECHINCHA.id,
        cliente: "Carlos Lima",
        descricao: "Mensalidade Abril",
        categoria: "MENSALIDADE",
        competencia: "2026-04-01",
        dataVencimento: "2026-04-08",
        valorOriginal: 209.9,
        desconto: 0,
        jurosMulta: 0,
        status: "PENDENTE",
        dataCriacao: "2026-04-02T08:30:00",
      },
    ],
  } as const;

  const gradesByTenant = {
    [TENANT_MANANCIAIS.id]: [
      {
        id: "grade-mananciais-1",
        tenantId: TENANT_MANANCIAIS.id,
        atividadeId: "atividade-bike",
        diasSemana: ["SEG", "QUA"],
        definicaoHorario: "PREVIAMENTE",
        horaInicio: "07:00",
        horaFim: "07:50",
        capacidade: 20,
        duracaoMinutos: 50,
        checkinLiberadoMinutosAntes: 15,
        acessoClientes: "TODOS_CLIENTES",
        permiteReserva: true,
        limitarVagasAgregadores: false,
        exibirWellhub: true,
        permitirSaidaAntesInicio: false,
        permitirEscolherNumeroVaga: false,
        exibirNoAppCliente: true,
        exibirNoAutoatendimento: true,
        exibirNoWodTv: false,
        finalizarAtividadeAutomaticamente: true,
        desabilitarListaEspera: false,
        ativo: true,
      },
    ],
    [TENANT_PECHINCHA.id]: [
      {
        id: "grade-pechincha-1",
        tenantId: TENANT_PECHINCHA.id,
        atividadeId: "atividade-yoga",
        diasSemana: ["TER", "QUI"],
        definicaoHorario: "PREVIAMENTE",
        horaInicio: "18:00",
        horaFim: "18:50",
        capacidade: 18,
        duracaoMinutos: 50,
        checkinLiberadoMinutosAntes: 20,
        acessoClientes: "TODOS_CLIENTES",
        permiteReserva: true,
        limitarVagasAgregadores: false,
        exibirWellhub: false,
        permitirSaidaAntesInicio: false,
        permitirEscolherNumeroVaga: false,
        exibirNoAppCliente: true,
        exibirNoAutoatendimento: true,
        exibirNoWodTv: false,
        finalizarAtividadeAutomaticamente: true,
        desabilitarListaEspera: false,
        ativo: true,
      },
    ],
  } as const;

  const reservasByTenant = {
    [TENANT_MANANCIAIS.id]: [
      {
        id: "reserva-mananciais-1",
        tenantId: TENANT_MANANCIAIS.id,
        sessaoId: "sessao-mananciais-1",
        atividadeGradeId: "grade-mananciais-1",
        atividadeId: "atividade-bike",
        atividadeNome: "Bike Indoor",
        alunoId: "aluno-mananciais-1",
        alunoNome: "Maria Santos",
        data: "2026-03-16",
        horaInicio: "07:00",
        horaFim: "07:50",
        origem: "BACKOFFICE",
        status: "CONFIRMADA",
        dataCriacao: "2026-03-12T08:00:00",
      },
    ],
    [TENANT_PECHINCHA.id]: [
      {
        id: "reserva-pechincha-1",
        tenantId: TENANT_PECHINCHA.id,
        sessaoId: "sessao-pechincha-1",
        atividadeGradeId: "grade-pechincha-1",
        atividadeId: "atividade-yoga",
        atividadeNome: "Yoga Flow",
        alunoId: "aluno-pechincha-1",
        alunoNome: "Carlos Lima",
        data: "2026-03-17",
        horaInicio: "18:00",
        horaFim: "18:50",
        origem: "BACKOFFICE",
        status: "CONFIRMADA",
        dataCriacao: "2026-03-12T09:30:00",
      },
    ],
  } as const;

  await page.route("**/api/v1/unidades", async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }

    await fulfillJson(route, [TENANT_MANANCIAIS, TENANT_PECHINCHA]);
  });

  await page.route("**/api/v1/academia", async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }

    await fulfillJson(route, ACADEMIA);
  });

  await page.route("**/api/v1/crm/prospects**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = normalizePath(url.pathname);
    const tenantId = url.searchParams.get("tenantId")?.trim() || TENANT_MANANCIAIS.id;

    if (request.method() !== "GET" || path !== "/api/v1/crm/prospects") {
      await route.fallback();
      return;
    }

    await fulfillJson(route, {
      items: prospectsByTenant[tenantId as keyof typeof prospectsByTenant] ?? [],
      page: 0,
      size: 20,
      hasNext: false,
    });
  });

  await page.route("**/api/v1/comercial/alunos**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = normalizePath(url.pathname);
    const tenantId = url.searchParams.get("tenantId")?.trim() || TENANT_MANANCIAIS.id;
    const alunos = alunosByTenant[tenantId as keyof typeof alunosByTenant] ?? [];

    if (request.method() !== "GET" || path !== "/api/v1/comercial/alunos") {
      await route.fallback();
      return;
    }

    await fulfillJson(route, {
      items: alunos,
      page: 0,
      size: 1000,
      hasNext: false,
      totaisStatus: { total: alunos.length, ativos: alunos.length, suspensos: 0, inativos: 0, cancelados: 0 },
    });
  });

  await page.route("**/api/v1/comercial/matriculas**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = normalizePath(url.pathname);
    const tenantId = url.searchParams.get("tenantId")?.trim() || TENANT_MANANCIAIS.id;

    if (request.method() !== "GET" || path !== "/api/v1/comercial/matriculas") {
      await route.fallback();
      return;
    }

    await fulfillJson(route, matriculasByTenant[tenantId as keyof typeof matriculasByTenant] ?? []);
  });

  await page.route("**/api/v1/comercial/adesoes**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = normalizePath(url.pathname);
    const tenantId = url.searchParams.get("tenantId")?.trim() || TENANT_MANANCIAIS.id;

    if (request.method() !== "GET" || path !== "/api/v1/comercial/adesoes") {
      await route.fallback();
      return;
    }

    await fulfillJson(route, matriculasByTenant[tenantId as keyof typeof matriculasByTenant] ?? []);
  });

  await page.route("**/api/v1/gerencial/financeiro/contas-receber**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = normalizePath(url.pathname);
    const tenantId = url.searchParams.get("tenantId")?.trim() || TENANT_MANANCIAIS.id;
    const status = url.searchParams.get("status")?.trim();
    const statusMap = {
      PAGO: "RECEBIDA",
      PENDENTE: "PENDENTE",
      VENCIDO: "VENCIDA",
    } as const;

    if (request.method() !== "GET" || path !== "/api/v1/gerencial/financeiro/contas-receber") {
      await route.fallback();
      return;
    }

    const contas = contasReceberByTenant[tenantId as keyof typeof contasReceberByTenant] ?? [];
    const filtered = status ? contas.filter((item) => item.status === statusMap[status as keyof typeof statusMap]) : contas;
    await fulfillJson(route, filtered);
  });

  await page.route("**/api/v1/administrativo/atividades-grade**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = normalizePath(url.pathname);
    const tenantId = url.searchParams.get("tenantId")?.trim() || TENANT_MANANCIAIS.id;

    if (request.method() !== "GET" || path !== "/api/v1/administrativo/atividades-grade") {
      await route.fallback();
      return;
    }

    await fulfillJson(route, gradesByTenant[tenantId as keyof typeof gradesByTenant] ?? []);
  });

  await page.route("**/api/v1/agenda/aulas/reservas**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = normalizePath(url.pathname);
    const tenantId = url.searchParams.get("tenantId")?.trim() || TENANT_MANANCIAIS.id;

    if (request.method() !== "GET" || path !== "/api/v1/agenda/aulas/reservas") {
      await route.fallback();
      return;
    }

    await fulfillJson(route, {
      items: reservasByTenant[tenantId as keyof typeof reservasByTenant] ?? [],
    });
  });

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = normalizePath(url.pathname);

    const knownRoutes = [
      "/api/v1/auth/me",
      "/api/v1/app/bootstrap",
      "/api/v1/context/unidade-ativa",
      "/api/v1/unidades",
      "/api/v1/academia",
      "/api/v1/crm/prospects",
      "/api/v1/comercial/alunos",
      "/api/v1/comercial/matriculas",
      "/api/v1/comercial/adesoes",
      "/api/v1/gerencial/financeiro/contas-receber",
      "/api/v1/administrativo/atividades-grade",
      "/api/v1/agenda/aulas/reservas",
    ];

    if (
      knownRoutes.includes(path)
      || path.startsWith("/api/v1/context/unidade-ativa/")
    ) {
      await route.fallback();
      return;
    }

    await fulfillJson(route, {});
  });
}

test.describe("BI operacional e visão de rede", () => {
  test.setTimeout(120_000);

  test("navega entre visão unitária e rede com filtros gerenciais", async ({ page }) => {
    await installBiApiMocks(page);
    await page.goto("/login");
    await applyE2EAuthSession(page, {
      activeTenantId: TENANT_MANANCIAIS.id,
      availableTenants: [
        { tenantId: TENANT_MANANCIAIS.id, defaultTenant: true },
        { tenantId: TENANT_PECHINCHA.id },
      ],
      userId: "user-admin",
      userKind: "COLABORADOR",
      displayName: "Admin BI",
      roles: ["OWNER", "ADMIN"],
      availableScopes: ["UNIDADE"],
      broadAccess: false,
    });

    await page.goto("/gerencial/bi");
    await expect(page.getByRole("heading", { name: "BI Operacional" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: "Exportar CSV" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Benchmark por unidade")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("row").filter({ hasText: "MANANCIAIS - S1" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("row").filter({ hasText: "PECHINCHA - S3" })).toBeVisible({ timeout: 15_000 });

    await page.getByLabel("Escopo BI").click();
    await page.getByRole("option", { name: "Academia / rede" }).click();
    await expect(page.getByLabel("Academia BI")).toContainText("Academia Sergio Amim", { timeout: 15_000 });

    await page.getByRole("link", { name: "Abrir visão de rede" }).click();
    await expect(page.getByRole("heading", { name: "Visão de Rede" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Rede consolidada")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Ranking da rede")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("row").filter({ hasText: "MANANCIAIS - S1" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("row").filter({ hasText: "PECHINCHA - S3" })).toBeVisible({ timeout: 15_000 });

    await page.getByLabel("Unidade Rede").click();
    await page.getByRole("option", { name: "PECHINCHA - S3" }).click();
    await expect(page.getByLabel("Unidade Rede")).toContainText("PECHINCHA - S3", { timeout: 15_000 });
    await expect(page.getByText("Unidade filtrada")).toBeVisible({ timeout: 15_000 });

    await page.getByLabel("Segmento Rede").click();
    await page.getByRole("option", { name: "WhatsApp" }).click();
    await expect(page.getByText("Checklist de governança")).toBeVisible({ timeout: 15_000 });
  });
});
