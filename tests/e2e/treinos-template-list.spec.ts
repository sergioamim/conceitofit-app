import { expect, test, type Page } from "@playwright/test";
import { installE2EAuthSession } from "./support/auth-session";
import { installOperationalAppShellMocks } from "./support/protected-shell-mocks";

type TemplateStub = {
  id: string;
  nome: string;
  professorId?: string;
  professorNome?: string;
  status: "PUBLICADO" | "EM_REVISAO" | "ARQUIVADO";
  frequenciaSemanal?: number;
  totalSemanas?: number;
  categoria?: string;
  perfilIndicacao?: string;
  versaoTemplate?: number;
  precisaRevisao: boolean;
  pendenciasAbertas: number;
  atualizadoEm: string;
};

const TEMPLATE_TOTALS = {
  totalTemplates: 3,
  publicados: 2,
  emRevisao: 1,
  comPendencias: 1,
};

const templateFixtures: TemplateStub[] = [
  {
    id: "tpl-alpha",
    nome: "Treino Padrão Alpha",
    professorId: "prof-1",
    professorNome: "Paula Lima",
    status: "PUBLICADO",
    frequenciaSemanal: 4,
    totalSemanas: 4,
    categoria: "Hipertrofia",
    perfilIndicacao: "INTERMEDIARIO",
    versaoTemplate: 3,
    precisaRevisao: false,
    pendenciasAbertas: 0,
    atualizadoEm: "2026-03-14T10:00:00.000Z",
  },
  {
    id: "tpl-bravo",
    nome: "Treino Padrão Bravo",
    professorId: "prof-2",
    professorNome: "Caio Costa",
    status: "PUBLICADO",
    frequenciaSemanal: 3,
    totalSemanas: 6,
    categoria: "Força",
    perfilIndicacao: "AVANCADO",
    versaoTemplate: 1,
    precisaRevisao: false,
    pendenciasAbertas: 0,
    atualizadoEm: "2026-03-13T10:00:00.000Z",
  },
  {
    id: "tpl-review",
    nome: "Treino Rascunho",
    professorId: "prof-1",
    professorNome: "Paula Lima",
    status: "EM_REVISAO",
    frequenciaSemanal: 2,
    totalSemanas: 6,
    categoria: "Mobilidade",
    perfilIndicacao: "INICIANTE",
    versaoTemplate: 2,
    precisaRevisao: true,
    pendenciasAbertas: 1,
    atualizadoEm: "2026-03-12T09:00:00.000Z",
  },
];

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

function buildTemplateResponse(pageNumber: number, search: string, reviewOnly: boolean) {
  const filtered = templateFixtures.filter((item) => {
    if (reviewOnly && !item.precisaRevisao) return false;
    if (!search) return true;
    return `${item.nome} ${item.professorNome ?? ""}`.toLowerCase().includes(search);
  });

  const ordered = [...filtered].sort((left, right) => right.atualizadoEm.localeCompare(left.atualizadoEm));
  const effectiveSize = search ? Math.max(ordered.length, 1) : 1;
  const items = ordered.slice(pageNumber * effectiveSize, pageNumber * effectiveSize + effectiveSize);

  return {
    items,
    page: pageNumber,
    size: effectiveSize,
    total: ordered.length,
    hasNext: (pageNumber + 1) * effectiveSize < ordered.length,
    totais: TEMPLATE_TOTALS,
  };
}

function installTreinosListStubs(page: Page) {
  return Promise.all([
    page.route("**/backend/api/v1/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "user-1",
          nome: "Admin Treinos",
          email: "admin@academia.local",
          roles: ["ADMIN"],
          activeTenantId: "tn-1",
          availableTenants: [{ tenantId: "tn-1", defaultTenant: true }],
        }),
      });
    }),
    page.route("**/backend/api/v1/context/unidade-ativa", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          currentTenantId: "tn-1",
          tenantAtual: {
            id: "tn-1",
            academiaId: "acd-1",
            nome: "Unidade Centro",
            ativo: true,
          },
          unidadesDisponiveis: [
            {
              id: "tn-1",
              academiaId: "acd-1",
              nome: "Unidade Centro",
              ativo: true,
            },
          ],
        }),
      });
    }),
    page.route("**/backend/api/v1/exercicios**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "ex-1",
            tenantId: "tn-1",
            nome: "Agachamento",
            aparelho: "Barra",
            ativo: true,
          },
        ]),
      });
    }),
    page.route("**/backend/api/v1/comercial/alunos**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              id: "al-1",
              tenantId: "tn-1",
              nome: "Ana Paula",
              status: "ATIVO",
            },
          ],
          page: 0,
          size: 200,
          total: 1,
          hasNext: false,
        }),
      });
    }),
    page.route("**/backend/api/v1/treinos/templates**", async (route) => {
      const url = new URL(route.request().url());
      const pageNumber = Number(url.searchParams.get("page") ?? "0");
      const search = (url.searchParams.get("search") ?? "").toLowerCase();
      const reviewOnly = url.searchParams.get("precisaRevisao") === "true";

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(buildTemplateResponse(pageNumber, search, reviewOnly)),
      });
    }),
  ]);
}

test.describe("Treino padrão listagem", () => {
  test("usa endpoint canônico de templates com busca server-side, paginação e filtro de pendências", async ({ page }) => {
    await seedSession(page);
    await installTreinosListStubs(page);
    await page.goto("/treinos");

    await expect(page.getByRole("heading", { name: "Treino Padrão" })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "Treino Padrão Alpha" })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "Treino Padrão Bravo" })).toBeHidden();
    await expect(page.getByRole("button", { name: "Pendências (1)" })).toBeVisible();
    await expect(page.locator("main").getByRole("link", { name: "Treinos atribuídos", exact: true })).toBeVisible();
    await expect(page.getByText("0 pendência(s) aberta(s)")).toBeVisible();
    await expect(page.getByText("v3")).toBeVisible();
    await expect(page.getByText("3 template(s)")).toBeVisible();

    await page.getByRole("button", { name: "Próxima" }).click();
    await expect(page.getByRole("row").filter({ hasText: "Treino Padrão Bravo" })).toBeVisible();

    await page.getByRole("button", { name: "Pendências (1)" }).click();
    await expect(page.getByRole("row").filter({ hasText: "Treino Rascunho" })).toBeVisible();
    await expect(page.getByText("EM_REVISAO", { exact: true })).toBeVisible();
    await expect(page.getByText("Mostrar todos")).toBeVisible();

    await page.getByRole("button", { name: "Mostrar todos" }).click();
    await page.getByLabel("Buscar template por nome ou professor").fill("Bravo");
    await expect(page.getByRole("row").filter({ hasText: "Treino Padrão Bravo" })).toBeVisible();
    await expect(page.getByText("Nenhum template encontrado com os filtros atuais")).toBeHidden();
  });

  test("mostra loading seguido de empty state quando a listagem retorna vazia", async ({ page }) => {
    await seedSession(page);
    await page.route("**/backend/api/v1/exercicios**", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
    });
    await page.route("**/backend/api/v1/comercial/alunos**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [], page: 0, size: 200, total: 0, hasNext: false }),
      });
    });
    await page.route("**/backend/api/v1/treinos/templates**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 700));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [],
          page: 0,
          size: 12,
          total: 0,
          hasNext: false,
          totais: {
            totalTemplates: 0,
            publicados: 0,
            emRevisao: 0,
            comPendencias: 0,
          },
        }),
      });
    });

    await page.route("**/backend/api/v1/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "user-1",
          nome: "Admin Treinos",
          email: "admin@academia.local",
          roles: ["ADMIN"],
          activeTenantId: "tn-1",
          availableTenants: [{ tenantId: "tn-1", defaultTenant: true }],
        }),
      });
    });
    await page.route("**/backend/api/v1/context/unidade-ativa", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          currentTenantId: "tn-1",
          tenantAtual: { id: "tn-1", academiaId: "acd-1", nome: "Unidade Centro", ativo: true },
          unidadesDisponiveis: [{ id: "tn-1", academiaId: "acd-1", nome: "Unidade Centro", ativo: true }],
        }),
      });
    });
    await page.goto("/treinos");
    await expect(page.getByText("Carregando templates...")).toBeVisible();
    await expect(page.getByText("Nenhum treino padrão encontrado")).toBeVisible();
  });

  test("mostra erro e ação de retry quando a carga da listagem falha", async ({ page }) => {
    await seedSession(page);
    await page.route("**/backend/api/v1/treinos/templates**", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "Falha ao carregar treino padrão." }),
      });
    });

    await page.route("**/backend/api/v1/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "user-1",
          nome: "Admin Treinos",
          email: "admin@academia.local",
          roles: ["ADMIN"],
          activeTenantId: "tn-1",
          availableTenants: [{ tenantId: "tn-1", defaultTenant: true }],
        }),
      });
    });
    await page.route("**/backend/api/v1/context/unidade-ativa", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          currentTenantId: "tn-1",
          tenantAtual: { id: "tn-1", academiaId: "acd-1", nome: "Unidade Centro", ativo: true },
          unidadesDisponiveis: [{ id: "tn-1", academiaId: "acd-1", nome: "Unidade Centro", ativo: true }],
        }),
      });
    });
    await page.route("**/backend/api/v1/exercicios**", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
    });
    await page.route("**/backend/api/v1/comercial/alunos**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [], page: 0, size: 200, total: 0, hasNext: false }),
      });
    });
    await page.goto("/treinos");
    await expect(page.getByText("Falha ao carregar treino padrão.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Tentar novamente" })).toBeVisible();
  });
});
