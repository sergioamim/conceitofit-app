import type { Page, Route } from "@playwright/test";

/**
 * Mocks compartilhados para as rotas de API consumidas pelo portal do aluno
 * `(cliente)/*`. Cada spec pode sobrescrever rotas individuais antes de
 * chamar estes helpers (ou passar overrides via options).
 */

export type AlunoMockOptions = {
  tenantId: string;
  userId: string;
  displayName?: string;
};

function fulfillJson(route: Route, body: unknown, status = 200): Promise<void> {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

function normalizeApiPath(pathname: string): string {
  return pathname.replace(/^\/backend/, "");
}

/**
 * Instala mocks de APIs compartilhadas por QUALQUER tela do portal:
 * - /auth/me
 * - /context/unidade-ativa
 * - /app-cliente/contexto
 * - /app-cliente/home-snapshot
 * - /app-cliente/financeiro/inadimplencia (estado "em dia")
 * - /comercial/clientes/{id}/contexto-operacional
 *
 * Retorna uma função `use(fn)` que permite adicionar handlers por spec,
 * seguindo o padrão já usado em outros helpers do repo.
 */
export async function installAlunoCommonMocks(
  page: Page,
  options: AlunoMockOptions,
): Promise<void> {
  const { tenantId, userId, displayName = "Aluno E2E" } = options;

  // /auth/me e contexto de unidade ativa
  await page.route("**/api/v1/auth/me", async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    await fulfillJson(route, {
      id: userId,
      nome: displayName,
      email: "aluno@academia.local",
      roles: ["ALUNO"],
      activeTenantId: tenantId,
      availableTenants: [{ tenantId, defaultTenant: true }],
    });
  });

  await page.route("**/api/v1/context/unidade-ativa", async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    await fulfillJson(route, {
      currentTenantId: tenantId,
      tenantAtual: { id: tenantId, nome: "Academia E2E", ativo: true },
      unidadesDisponiveis: [{ id: tenantId, nome: "Academia E2E", ativo: true }],
    });
  });

  // /app-cliente/contexto — shell layout
  await page.route("**/api/v1/app-cliente/contexto**", async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    await fulfillJson(route, {
      tenantId,
      alunoId: userId,
      alunoNome: displayName,
      academiaNome: "Academia E2E",
      matriculaAtiva: true,
    });
  });

  // /app-cliente/home-snapshot — usado por algumas páginas
  await page.route("**/api/v1/app-cliente/home-snapshot**", async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    await fulfillJson(route, {
      financeiro: {
        totalPendente: 0,
        totalVencido: 0,
        proximoVencimento: null,
      },
      agenda: {
        proximaAula: null,
        totalReservasHoje: 0,
      },
      treino: {
        treinoAtivoNome: "Treino A",
        ultimaExecucao: null,
        aderenciaPercentual: 80,
      },
      checkin: {
        ultimoCheckin: null,
        totalMes: 3,
      },
      avaliacao: {
        proximaAvaliacao: null,
      },
    });
  });

  // Banner de inadimplência — sempre "em dia" por default
  await page.route(
    "**/api/v1/app-cliente/financeiro/inadimplencia**",
    async (route) => {
      if (route.request().method() !== "GET") return route.continue();
      await fulfillJson(route, {
        inadimplente: false,
        totalVencido: 0,
        diasMaiorAtraso: 0,
        cobrancasVencidas: [],
      });
    },
  );

  // Contexto operacional do cliente (polling usado pelo topbar)
  await page.route(
    new RegExp(`.*/api/v1/comercial/clientes/${userId}/contexto-operacional.*`),
    async (route) => {
      if (route.request().method() !== "GET") return route.continue();
      await fulfillJson(route, {
        tenantId,
        tenantNome: "Academia E2E",
        aluno: {
          id: userId,
          tenantId,
          nome: displayName,
          email: "aluno@academia.local",
          telefone: "11999999999",
          cpf: "12345678901",
          dataNascimento: "1990-01-01",
          sexo: "M",
          status: "ATIVO",
          dataCadastro: "2025-01-01T00:00:00Z",
        },
        eligibleTenants: [
          {
            tenantId,
            tenantNome: "Academia E2E",
            defaultTenant: true,
            blockedReasons: [],
          },
        ],
        blockedTenants: [],
        blocked: false,
      });
    },
  );

  // Device tokens (push) — silenciar qualquer chamada
  await page.route("**/api/v1/app-cliente/notificacoes/**", async (route) => {
    await fulfillJson(route, { ok: true });
  });

  // Helper catch-all para o normalizeApiPath
  void normalizeApiPath;
}
