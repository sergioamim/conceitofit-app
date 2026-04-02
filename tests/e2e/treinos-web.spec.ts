import { expect, test, type Page } from "@playwright/test";
import { installE2EAuthSession } from "./support/auth-session";
import { installOperationalAppShellMocks } from "./support/protected-shell-mocks";

type StubTreino = {
  id: string;
  tenantId: string;
  nome: string;
  templateNome: string;
  objetivo: string;
  divisao: string;
  metaSessoesSemana: number;
  frequenciaPlanejada: number;
  quantidadePrevista: number;
  dataInicio: string;
  dataFim: string;
  observacoes: string;
  professorId?: string;
  professorNome?: string;
  status: string;
  tipoTreino: string;
  ativo: boolean;
  itens: Array<{
    id: string;
    treinoId: string;
    exercicioId?: string;
    exercicioNomeSnapshot?: string;
    ordem: number;
    series: number;
  }>;
  revisoes: Array<Record<string, unknown>>;
  execucoes: Array<Record<string, unknown>>;
  createdAt: string;
  updatedAt: string;
};

function json(body: unknown, status = 200) {
  return {
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  };
}

function seedSession(page: Page) {
  const session = installE2EAuthSession(page, {
    activeTenantId: "tn-1",
    baseTenantId: "tn-1",
    availableTenants: [{ tenantId: "tn-1", defaultTenant: true }],
    userId: "user-1",
    userKind: "COLABORADOR",
    displayName: "Admin Treinos",
    roles: ["ADMIN"],
    availableScopes: ["UNIDADE"],
  });

  const shell = installOperationalAppShellMocks(page, {
    currentTenantId: "tn-1",
    tenants: [
      {
        id: "tn-1",
        nome: "Unidade Centro",
        academiaId: "acd-1",
        groupId: "acd-1",
        ativo: true,
      },
    ],
    user: {
      id: "user-1",
      userId: "user-1",
      nome: "Admin Treinos",
      displayName: "Admin Treinos",
      email: "admin@academia.local",
      roles: ["ADMIN"],
      userKind: "COLABORADOR",
      activeTenantId: "tn-1",
      tenantBaseId: "tn-1",
      availableTenants: [{ tenantId: "tn-1", defaultTenant: true }],
      availableScopes: ["UNIDADE"],
      broadAccess: false,
      redeId: "acd-1",
      redeNome: "Academia Treinos",
      redeSlug: "academia-treinos",
    },
    academia: {
      id: "acd-1",
      nome: "Academia Treinos",
      ativo: true,
    },
    routes: {
      authRefresh: true,
      onboardingStatus: true,
    },
  });

  return Promise.all([session, shell]);
}

async function installTreinosWebStubs(page: Page) {
  const template: StubTreino = {
    id: "tpl-1",
    tenantId: "tn-1",
    nome: "Template Base",
    templateNome: "Template Base",
    objetivo: "Hipertrofia",
    divisao: "A",
    metaSessoesSemana: 3,
    frequenciaPlanejada: 3,
    quantidadePrevista: 12,
    dataInicio: "2026-03-10",
    dataFim: "2026-04-06",
    observacoes: "Template original do stub",
    professorId: "prof-1",
    professorNome: "Paula Lima",
    status: "RASCUNHO",
    tipoTreino: "PRE_MONTADO",
    ativo: true,
    itens: [
      {
        id: "item-1",
        treinoId: "tpl-1",
        exercicioId: "ex-1",
        exercicioNomeSnapshot: "Agachamento",
        ordem: 1,
        series: 4,
      },
    ],
    revisoes: [],
    execucoes: [],
    createdAt: "2026-03-14T10:00:00.000Z",
    updatedAt: "2026-03-14T10:05:00.000Z",
  };

  await Promise.all([
    page.route("**/backend/api/v1/comercial/alunos**", async (route) => {
      await route.fulfill(
        json({
          items: [],
          page: 0,
          size: 200,
          total: 0,
          hasNext: false,
        }),
      );
    }),
    page.route("**/backend/api/v1/exercicios**", async (route) => {
      await route.fulfill(
        json([
          {
            id: "ex-1",
            tenantId: "tn-1",
            nome: "Agachamento",
            grupoMuscularId: "gm-1",
            grupoMuscularNome: "Quadríceps",
            unidade: "kg",
            ativo: true,
          },
        ]),
      );
    }),
    page.route("**/backend/api/v1/treinos/templates**", async (route) => {
      await route.fulfill(
        json({
          items: [
            {
              id: template.id,
              nome: template.nome,
              professorId: template.professorId,
              professorNome: template.professorNome,
              status: "PUBLICADO",
              frequenciaSemanal: template.frequenciaPlanejada,
              totalSemanas: 4,
              categoria: template.objetivo,
              perfilIndicacao: "INTERMEDIARIO",
              versaoTemplate: 3,
              precisaRevisao: false,
              pendenciasAbertas: 0,
              atualizadoEm: template.updatedAt,
            },
          ],
          page: 0,
          size: 20,
          total: 1,
          hasNext: false,
          totais: {
            totalTemplates: 1,
            publicados: 1,
            emRevisao: 0,
            comPendencias: 0,
          },
        }),
      );
    }),
    page.route("**/backend/api/v1/treinos**", async (route) => {
      const url = new URL(route.request().url());
      const pathname = url.pathname;
      const method = route.request().method();

      if (pathname.endsWith("/treinos/tpl-1") && method === "GET") {
        await route.fulfill(json(template));
        return;
      }

      await route.continue();
    }),
  ]);
}

test.describe("treinos web v2", () => {
  test("abre um template existente e renderiza o editor unificado", async ({ page }) => {
    await seedSession(page);
    await installTreinosWebStubs(page);

    await page.goto("/treinos/tpl-1");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page).toHaveURL(/\/treinos\/tpl-1$/);
    await expect(page.getByRole("heading", { name: "Template Base" })).toBeVisible();
    await expect(page.getByText("Shell do editor")).toBeVisible();
    await expect(page.getByText("Blocos e séries")).toBeVisible();
    await expect(page.getByText("Biblioteca lateral", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Salvar rascunho" })).toBeVisible();
  });
});
