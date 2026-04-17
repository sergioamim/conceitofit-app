import { expect, test, type Page, type Request, type Route } from "@playwright/test";
import { installAdminCrudApiMocks, seedAuthenticatedSession } from "./support/backend-only-stubs";
import { installOperationalAppShellMocks } from "./support/protected-shell-mocks";

function normalizePath(pathname: string) {
  return pathname.replace(/^\/backend/, "");
}

async function fulfillJson(route: Route, json: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify(json),
  });
}

function getTenantId(request: Request) {
  return new URL(request.url()).searchParams.get("tenantId")?.trim() ?? "";
}

async function installOperacionalGradeCatracaApi(page: Page) {
  await installAdminCrudApiMocks(page);
  await installOperationalAppShellMocks(page, {
    currentTenantId: "tenant-centro",
    tenants: [
      {
        id: "tenant-centro",
        nome: "Unidade Centro",
        ativo: true,
        academiaId: "academia-e2e",
        groupId: "academia-e2e",
      },
      {
        id: "tenant-zona-sul",
        nome: "Unidade Zona Sul",
        ativo: true,
        academiaId: "academia-e2e",
        groupId: "academia-e2e",
      },
    ],
    user: {
      id: "user-operacional",
      userId: "user-operacional",
      nome: "Operacional QA",
      displayName: "Operacional QA",
      email: "operacional@academia.local",
      roles: ["OWNER", "ADMIN"],
      activeTenantId: "tenant-centro",
      availableTenants: [
        { tenantId: "tenant-centro", defaultTenant: true },
        { tenantId: "tenant-zona-sul", defaultTenant: false },
      ],
      availableScopes: ["UNIDADE"],
      broadAccess: false,
      redeId: "academia-e2e",
      redeNome: "Academia E2E",
      redeSlug: "academia-e2e",
    },
    academia: {
      id: "academia-e2e",
      nome: "Academia E2E",
      ativo: true,
    },
    capabilities: {
      canAccessElevatedModules: true,
      canDeleteClient: false,
    },
  });

  await page.route("**/api/v1/context/horarios-funcionamento**", async (route) => {
    const request = route.request();
    const path = normalizePath(new URL(request.url()).pathname);
    const tenantId = getTenantId(request) || "tenant-centro";

    if (request.method() !== "GET" || path !== "/api/v1/context/horarios-funcionamento") {
      await route.fallback();
      return;
    }

    await fulfillJson(route, [
      { tenantId, dia: "SEG", abre: "06:00", fecha: "22:00", fechado: false },
      { tenantId, dia: "TER", abre: "06:00", fecha: "22:00", fechado: false },
      { tenantId, dia: "QUA", abre: "06:00", fecha: "22:00", fechado: false },
      { tenantId, dia: "QUI", abre: "06:00", fecha: "22:00", fechado: false },
      { tenantId, dia: "SEX", abre: "06:00", fecha: "22:00", fechado: false },
      { tenantId, dia: "SAB", abre: "08:00", fecha: "14:00", fechado: false },
      { tenantId, dia: "DOM", abre: "08:00", fecha: "12:00", fechado: false },
    ]);
  });

  await page.route("**/api/v1/administrativo/atividades**", async (route) => {
    const request = route.request();
    const path = normalizePath(new URL(request.url()).pathname);

    if (request.method() !== "GET" || path !== "/api/v1/administrativo/atividades") {
      await route.fallback();
      return;
    }

    await fulfillJson(route, {
      items: [
        {
          id: "atividade-bike",
          tenantId: "tenant-centro",
          nome: "Spinning",
          descricao: "Treino coletivo de bike indoor.",
          categoria: "COLETIVA",
          icone: "bike",
          cor: "#14b8a6",
          ativa: true,
          ativo: true,
          permiteCheckin: true,
          checkinObrigatorio: false,
        },
      ],
    });
  });

  await page.route("**/api/v1/administrativo/funcionarios**", async (route) => {
    const request = route.request();
    const path = normalizePath(new URL(request.url()).pathname);

    if (request.method() !== "GET" || path !== "/api/v1/administrativo/funcionarios") {
      await route.fallback();
      return;
    }

    await fulfillJson(route, [
      {
        id: "prof-1",
        tenantId: "tenant-centro",
        nome: "Ana Bike",
        email: "ana.bike@academia.local",
        telefone: "(21) 99999-1000",
        cpf: "12345678901",
        cargo: "PROFESSOR",
        especialidades: ["Bike indoor"],
        cref: "123456-G/RJ",
        ativo: true,
      },
    ]);
  });

  await page.route("**/api/v1/administrativo/salas**", async (route) => {
    const request = route.request();
    const path = normalizePath(new URL(request.url()).pathname);

    if (request.method() !== "GET" || path !== "/api/v1/administrativo/salas") {
      await route.fallback();
      return;
    }

    await fulfillJson(route, [
      {
        id: "sala-1",
        tenantId: "tenant-centro",
        nome: "Studio Bike",
        capacidade: 24,
        localizacao: "Piso superior",
        ativo: true,
      },
    ]);
  });

  await page.route("**/api/v1/administrativo/atividades-grade**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = normalizePath(url.pathname);
    const tenantId = url.searchParams.get("tenantId")?.trim() || "tenant-centro";

    if (request.method() !== "GET" || path !== "/api/v1/administrativo/atividades-grade") {
      await route.fallback();
      return;
    }

    await fulfillJson(route, [
      {
        id: "grade-bike",
        tenantId,
        atividadeId: "atividade-bike",
        diasSemana: ["SEG", "QUA", "SEX"],
        definicaoHorario: "PREVIAMENTE",
        horaInicio: "07:00",
        horaFim: "07:50",
        capacidade: 20,
        duracaoMinutos: 50,
        checkinLiberadoMinutosAntes: 20,
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
        permiteCheckin: true,
        checkinObrigatorio: false,
        salaId: "sala-1",
        funcionarioId: "prof-1",
        local: "Studio Bike",
        instrutor: "Ana Bike",
        ativo: true,
      },
    ]);
  });

  await page.route("**/api/v1/integracoes/catraca/ws/status**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = normalizePath(url.pathname);
    const tenantId = url.searchParams.get("tenantId")?.trim();

    if (request.method() !== "GET" || path !== "/api/v1/integracoes/catraca/ws/status") {
      await route.fallback();
      return;
    }

    if (tenantId) {
      await fulfillJson(route, {
        tenantId,
        connectedAgents: tenantId === "tenant-zona-sul" ? 0 : 2,
        agents:
          tenantId === "tenant-zona-sul"
            ? []
            : [
                { agentId: "catraca-centro-1", tenantId, sessionId: "sess-centro-1" },
                { agentId: "catraca-centro-2", tenantId, sessionId: "sess-centro-2" },
              ],
      });
      return;
    }

    await fulfillJson(route, {
      totalConnectedAgents: 2,
      tenants: [
        {
          tenantId: "tenant-centro",
          connectedAgents: 2,
          agents: [
            { agentId: "catraca-centro-1", tenantId: "tenant-centro", sessionId: "sess-centro-1" },
            { agentId: "catraca-centro-2", tenantId: "tenant-centro", sessionId: "sess-centro-2" },
          ],
        },
        {
          tenantId: "tenant-zona-sul",
          connectedAgents: 0,
          agents: [],
        },
      ],
    });
  });

  await page.route("**/api/v1/admin/unidades/*/catraca/integracao", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = normalizePath(url.pathname);

    if (request.method() !== "GET" || !path.startsWith("/api/v1/admin/unidades/") || !path.endsWith("/catraca/integracao")) {
      await route.fallback();
      return;
    }

    const segments = path.split("/");
    const tenantId = segments[5] || "tenant-centro";

    await fulfillJson(route, {
      tenantId,
      activeMembers: tenantId === "tenant-zona-sul" ? 87 : 146,
      membersWithPhoto: tenantId === "tenant-zona-sul" ? 74 : 131,
      devices: [
        {
          tenantId,
          deviceId: "idface-entrada",
          agentId: tenantId === "tenant-zona-sul" ? "agent-zs-1" : "agent-centro-1",
          nome: "iDFace Entrada",
          fabricante: "CONTROL_ID_IDFACE",
          ipLocal: "192.168.0.25",
          portaControle: 80,
          portaBiometria: 80,
          maxFaces: 3000,
          reservedFacesStaff: 100,
          ativo: true,
          operationMode: "EMBEDDED_FACE",
          supportsEmbeddedFace: true,
          supportsEdgeFace: false,
          supportsFingerprint: false,
          supportsQrCode: false,
          supportsFaceTemplateSync: true,
        },
      ],
      agents: [
        {
          agentId: tenantId === "tenant-zona-sul" ? "agent-zs-1" : "agent-centro-1",
          sessionId: "sess-1",
          pendingCommands: 0,
          awaitingPingAck: false,
          lastCommandStatus: "ACK_OK",
        },
      ],
    });
  });
}

async function abrirComSessaoMock(page: Page) {
  await seedAuthenticatedSession(page, {
    tenantId: "tenant-centro",
    availableTenants: [
      { tenantId: "tenant-centro", defaultTenant: true },
      { tenantId: "tenant-zona-sul", defaultTenant: false },
    ],
  });
}

test.describe("Operacional grade e catraca", () => {
  test.beforeEach(async ({ page }) => {
    await installOperacionalGradeCatracaApi(page);
  });

  test("abre telas migradas para API-only sem depender de mock runtime", async ({ page }) => {
    await abrirComSessaoMock(page);

    await page.goto("/grade", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Grade" })).toBeVisible();
    await expect(page.getByText("Calendário semanal das atividades configuradas na Grade")).toBeVisible();
    await expect(page.getByText("Local: Studio Bike").first()).toBeVisible();

    await page.goto("/atividades", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Atividades" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Nova Atividade" })).toBeVisible();
    await expect(page.getByText("Spinning")).toBeVisible();

    await page.goto("/administrativo/atividades-grade", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Atividades - Grade" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Nova Grade" })).toBeVisible();
    await expect(page.getByText("Studio Bike")).toBeVisible();

    await page.goto("/administrativo/catraca-status", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Integração facial da catraca" })).toBeVisible();
    await expect(page.getByText("Clientes ativos")).toBeVisible();
    await expect(page.getByText("Unidade Centro").first()).toBeVisible();
  });
});
