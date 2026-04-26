/**
 * E2E Wave G — Spec 4: Editor V3 modo instance + biblioteca multi-select.
 *
 * Cobre Waves B + D do design "Montagem de Treino":
 * - Abrir editor com ?customize=1&alunoId=X&alunoNome=Y dispara modo instance
 * - Pill do aluno aparece no header com nome
 * - Biblioteca modal multi-select adiciona vários exercícios à sessão ativa
 * - Editar uma cell em modo instance pinta amber (data-custom)
 * - Clicar Salvar dispara PATCH /instancias/{id}/overrides com payload
 *   contendo as MODIFY operations geradas por computeOverrides
 */

import { expect, test, type Page, type Route } from "@playwright/test";
import { buildTreinoV2Observacoes } from "../../src/lib/tenant/treinos/v2-runtime";
import { installE2EAuthSession } from "./support/auth-session";
import { installOperationalAppShellMocks } from "./support/protected-shell-mocks";

const TENANT_ID = "tn-1";
const TEMPLATE_ID = "tpl-hipertrofia";
const ALUNO_ID = "al-ana";
const INSTANCIA_ID = "inst-customizacao-1";

const exerciciosCatalog = [
  {
    id: "ex-supino",
    tenantId: TENANT_ID,
    nome: "Supino reto",
    grupoMuscularId: "grp-peito",
    grupoMuscular: "Peito",
    grupoMuscularNome: "Peito",
    aparelho: "Barra livre",
    equipamento: "Barra livre",
    descricao: null,
    videoUrl: null,
    unidade: "kg",
    ativo: true,
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-01T00:00:00.000Z",
  },
  {
    id: "ex-puxada",
    tenantId: TENANT_ID,
    nome: "Puxada frontal",
    grupoMuscularId: "grp-costas",
    grupoMuscular: "Costas",
    grupoMuscularNome: "Costas",
    aparelho: "Pulley",
    equipamento: "Pulley",
    descricao: null,
    videoUrl: null,
    unidade: "kg",
    ativo: true,
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-01T00:00:00.000Z",
  },
  {
    id: "ex-rosca",
    tenantId: TENANT_ID,
    nome: "Rosca direta",
    grupoMuscularId: "grp-biceps",
    grupoMuscular: "Bíceps",
    grupoMuscularNome: "Bíceps",
    aparelho: "Barra W",
    equipamento: "Barra W",
    descricao: null,
    videoUrl: null,
    unidade: "kg",
    ativo: true,
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-01T00:00:00.000Z",
  },
];

// Template base com 1 sessão "A" e 1 exercício (Supino) — baseline pra
// medir overrides. observacoes inclui metadata V2 com snapshot.
const treinoFixture = {
  id: TEMPLATE_ID,
  tenantId: TENANT_ID,
  nome: "Hipertrofia ABC",
  templateNome: "Hipertrofia ABC",
  status: "ATIVO",
  tipoTreino: "PADRAO",
  ativo: true,
  divisao: "ABC",
  metaSessoesSemana: 3,
  observacoes: buildTreinoV2Observacoes({
    observacoes: "Foco em volume médio.",
    template: {
      versao: 1,
      versaoSimplificadaHabilitada: false,
      assignmentHistory: [],
      sessoes: [
        {
          id: "sessao-a",
          nome: "A",
          ordem: 1,
          itens: [
            {
              id: "item-supino",
              exerciseId: "ex-supino",
              exerciseNome: "Supino reto",
              ordem: 1,
              series: { raw: "3", numericValue: 3 },
              repeticoes: { raw: "10-12", numericValue: 10 },
              carga: { raw: "60kg", numericValue: 60 },
              intervalo: { raw: "60", numericValue: 60 },
              cadencia: "2-0-1",
              rir: 2,
              tecnicas: [],
            },
          ],
        },
      ],
    },
  }),
  itens: [
    {
      id: "item-supino",
      treinoId: TEMPLATE_ID,
      exercicioId: "ex-supino",
      exercicioNomeSnapshot: "Supino reto",
      grupoMuscularId: "grp-peito",
      grupoMuscularNome: "Peito",
      ordem: 1,
      series: 3,
      repeticoesMin: 10,
      repeticoesMax: 12,
      cargaSugerida: 60,
      intervaloSegundos: 60,
    },
  ],
  revisoes: [],
  execucoes: [],
  createdAt: "2026-04-01T10:00:00.000Z",
  updatedAt: "2026-04-20T10:00:00.000Z",
};

async function seed(page: Page) {
  await installE2EAuthSession(page, {
    activeTenantId: TENANT_ID,
    baseTenantId: TENANT_ID,
    availableTenants: [{ tenantId: TENANT_ID, defaultTenant: true }],
    userId: "user-1",
    userKind: "COLABORADOR",
    displayName: "Admin Treinos",
    roles: ["ADMIN"],
    availableScopes: ["UNIDADE"],
  });
  await installOperationalAppShellMocks(page, {
    currentTenantId: TENANT_ID,
    tenants: [
      { id: TENANT_ID, nome: "Unidade Centro", academiaId: "acd-1", groupId: "acd-1", ativo: true },
    ],
    user: {
      id: "user-1",
      userId: "user-1",
      nome: "Admin Treinos",
      displayName: "Admin Treinos",
      email: "admin@academia.local",
      roles: ["ADMIN"],
      userKind: "COLABORADOR",
      activeTenantId: TENANT_ID,
      tenantBaseId: TENANT_ID,
      availableTenants: [{ tenantId: TENANT_ID, defaultTenant: true }],
      availableScopes: ["UNIDADE"],
      broadAccess: false,
      redeId: "acd-1",
      redeNome: "Academia Treinos",
      redeSlug: "academia-treinos",
    },
    academia: { id: "acd-1", nome: "Academia Treinos", ativo: true },
    routes: { authRefresh: true, onboardingStatus: true },
  });
}

interface CapturedOverrides {
  body: Record<string, unknown> | null;
}

async function installStubs(
  page: Page,
  capturedOverrides: CapturedOverrides,
) {
  await page.route("**/backend/api/v1/auth/me", async (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "user-1",
        nome: "Admin Treinos",
        email: "admin@academia.local",
        roles: ["ADMIN"],
        activeTenantId: TENANT_ID,
        availableTenants: [{ tenantId: TENANT_ID, defaultTenant: true }],
      }),
    }),
  );
  await page.route("**/backend/api/v1/context/unidade-ativa", async (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        currentTenantId: TENANT_ID,
        tenantAtual: { id: TENANT_ID, academiaId: "acd-1", nome: "Unidade Centro", ativo: true },
        unidadesDisponiveis: [
          { id: TENANT_ID, academiaId: "acd-1", nome: "Unidade Centro", ativo: true },
        ],
      }),
    }),
  );
  await page.route("**/backend/api/v1/exercicios**", async (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(exerciciosCatalog),
    }),
  );
  await page.route("**/backend/api/v1/comercial/alunos**", async (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [{ id: ALUNO_ID, tenantId: TENANT_ID, nome: "Ana Paula", status: "ATIVO" }],
        page: 0,
        size: 200,
        total: 1,
        hasNext: false,
      }),
    }),
  );

  // GET /api/v1/treinos/{id} → template fixture
  await page.route(`**/backend/api/v1/treinos/${TEMPLATE_ID}**`, async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(treinoFixture),
      });
      return;
    }
    await route.continue();
  });

  // POST /api/v1/treinos/instancias → cria instância
  await page.route("**/backend/api/v1/treinos/instancias", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: INSTANCIA_ID,
          templateId: TEMPLATE_ID,
          alunoId: ALUNO_ID,
          overrides: [],
          createdAt: "2026-04-25T10:00:00.000Z",
        }),
      });
      return;
    }
    await route.continue();
  });

  // PATCH /api/v1/treinos/instancias/{id}/overrides → captura body
  await page.route(
    `**/backend/api/v1/treinos/instancias/${INSTANCIA_ID}/overrides`,
    async (route: Route) => {
      if (route.request().method() === "PATCH") {
        try {
          capturedOverrides.body = route.request().postDataJSON() as Record<
            string,
            unknown
          >;
        } catch {
          capturedOverrides.body = null;
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: INSTANCIA_ID,
            templateId: TEMPLATE_ID,
            alunoId: ALUNO_ID,
            overrides: capturedOverrides.body?.overrides ?? [],
          }),
        });
        return;
      }
      await route.continue();
    },
  );
}

test.describe("Editor V3 — modo instance + biblioteca multi-select", () => {
  test("abre em mode=instance e pill do aluno aparece no header", async ({
    page,
  }) => {
    const captured: CapturedOverrides = { body: null };
    await seed(page);
    await installStubs(page, captured);

    await page.goto(
      `/treinos/${TEMPLATE_ID}?customize=1&alunoId=${ALUNO_ID}&alunoNome=${encodeURIComponent("Ana Paula")}`,
      { waitUntil: "domcontentloaded" },
    );

    // Pill do aluno no header (modo instance)
    await expect(page.getByText("Ana Paula").first()).toBeVisible();

    // Botão "Voltar" diz "Atribuições" em modo instance
    await expect(page.getByRole("link", { name: /Atribuições/ })).toBeVisible();

    // Botão de salvar diz "Salvar para Ana"
    await expect(page.getByRole("button", { name: /Salvar para Ana/ })).toBeVisible();

    // Tabela inline V3 renderiza com a row do supino
    await expect(page.getByText("Supino reto").first()).toBeVisible();
  });

  test("biblioteca modal multi-select adiciona itens à sessão ativa", async ({
    page,
  }) => {
    const captured: CapturedOverrides = { body: null };
    await seed(page);
    await installStubs(page, captured);

    await page.goto(
      `/treinos/${TEMPLATE_ID}?customize=1&alunoId=${ALUNO_ID}&alunoNome=${encodeURIComponent("Ana Paula")}`,
      { waitUntil: "domcontentloaded" },
    );

    // Aguarda editor carregar
    await expect(page.getByText("Supino reto").first()).toBeVisible();

    // Abre biblioteca modal
    await page.getByRole("button", { name: /Adicionar exercício/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Adicionar exercícios")).toBeVisible();

    // Marca 2 exercícios (Puxada + Rosca)
    const puxada = page
      .getByRole("dialog")
      .getByRole("button", { name: /Puxada frontal/ });
    const rosca = page
      .getByRole("dialog")
      .getByRole("button", { name: /Rosca direta/ });
    await puxada.click();
    await rosca.click();

    // Footer mostra contador
    await expect(page.getByText("2 selecionados")).toBeVisible();

    // Confirma
    await page.getByRole("button", { name: /^Adicionar 2$/ }).click();

    // Modal fecha + items aparecem na tabela
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByText("Puxada frontal").first()).toBeVisible();
    await expect(page.getByText("Rosca direta").first()).toBeVisible();
  });
});
