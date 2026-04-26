/**
 * E2E Wave G — Spec 1: Templates V3 grid + favoritos.
 *
 * Cobre as features da Wave A do design "Montagem de Treino":
 * - grid de cards (não tabela) controlado pelo flag isTreinoEditorV3Enabled
 * - pills de filtro por objetivo (perfilIndicacao)
 * - estrela de favorito persistindo via localStorage
 * - clique no card inteiro abre o editor (não só o título)
 *
 * Não testa pixel/cores — só comportamento observável.
 */

import { expect, test, type Page } from "@playwright/test";
import { installE2EAuthSession } from "./support/auth-session";
import { installOperationalAppShellMocks } from "./support/protected-shell-mocks";

const TEMPLATE_TOTALS = {
  totalTemplates: 4,
  publicados: 4,
  emRevisao: 0,
  comPendencias: 0,
};

const templateFixtures = [
  {
    id: "tpl-hipertrofia",
    nome: "Hipertrofia ABC",
    professorNome: "Paula Lima",
    status: "PUBLICADO" as const,
    frequenciaSemanal: 3,
    totalSemanas: 8,
    categoria: "Hipertrofia",
    perfilIndicacao: "HIPERTROFIA",
    versaoTemplate: 3,
    precisaRevisao: false,
    pendenciasAbertas: 0,
    atualizadoEm: "2026-04-25T10:00:00.000Z",
    observacoes: "Foco em volume médio com progressão semanal de carga.",
    gruposMusculares: ["Peito", "Costas", "Pernas"],
    totalAtribuicoes: 8,
  },
  {
    id: "tpl-emagrecimento",
    nome: "Emagrecimento HIIT",
    professorNome: "João Silva",
    status: "PUBLICADO" as const,
    frequenciaSemanal: 5,
    totalSemanas: 6,
    categoria: "Emagrecimento",
    perfilIndicacao: "EMAGRECIMENTO",
    versaoTemplate: 1,
    precisaRevisao: false,
    pendenciasAbertas: 0,
    atualizadoEm: "2026-04-20T10:00:00.000Z",
    observacoes: "Cardio em circuito alternado com força.",
    gruposMusculares: ["Cardio", "Pernas", "Core"],
    totalAtribuicoes: 5,
  },
  {
    id: "tpl-condicionamento",
    nome: "Full Body 3x",
    professorNome: "Paula Lima",
    status: "PUBLICADO" as const,
    frequenciaSemanal: 3,
    totalSemanas: 4,
    categoria: "Condicionamento",
    perfilIndicacao: "CONDICIONAMENTO",
    versaoTemplate: 2,
    precisaRevisao: false,
    pendenciasAbertas: 0,
    atualizadoEm: "2026-04-18T10:00:00.000Z",
    observacoes: "Corpo inteiro 3 vezes na semana — iniciantes.",
    gruposMusculares: ["Peito", "Costas", "Pernas", "Core"],
    totalAtribuicoes: 12,
  },
  {
    id: "tpl-reabilitacao",
    nome: "Reabilitação Joelho",
    professorNome: "Carla Mendes",
    status: "PUBLICADO" as const,
    frequenciaSemanal: 2,
    totalSemanas: 12,
    categoria: "Reabilitação",
    perfilIndicacao: "REABILITACAO",
    versaoTemplate: 1,
    precisaRevisao: false,
    pendenciasAbertas: 0,
    atualizadoEm: "2026-04-10T10:00:00.000Z",
    observacoes: "Cargas baixas, amplitude controlada.",
    gruposMusculares: ["Pernas", "Core"],
    totalAtribuicoes: 2,
  },
];

async function seed(page: Page) {
  await installE2EAuthSession(page, {
    activeTenantId: "tn-1",
    baseTenantId: "tn-1",
    availableTenants: [{ tenantId: "tn-1", defaultTenant: true }],
    userId: "user-1",
    userKind: "COLABORADOR",
    displayName: "Admin Treinos",
    roles: ["ADMIN"],
    availableScopes: ["UNIDADE"],
  });
  await installOperationalAppShellMocks(page, {
    currentTenantId: "tn-1",
    tenants: [
      { id: "tn-1", nome: "Unidade Centro", academiaId: "acd-1", groupId: "acd-1", ativo: true },
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
    academia: { id: "acd-1", nome: "Academia Treinos", ativo: true },
    routes: { authRefresh: true, onboardingStatus: true },
  });
}

async function installStubs(page: Page) {
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
        unidadesDisponiveis: [
          { id: "tn-1", academiaId: "acd-1", nome: "Unidade Centro", ativo: true },
        ],
      }),
    });
  });
  await page.route("**/backend/api/v1/exercicios**", async (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    }),
  );
  await page.route("**/backend/api/v1/comercial/alunos**", async (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [], page: 0, size: 200, total: 0, hasNext: false }),
    }),
  );
  await page.route("**/backend/api/v1/treinos/templates**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: templateFixtures,
        page: 0,
        size: 50,
        total: templateFixtures.length,
        hasNext: false,
        totais: TEMPLATE_TOTALS,
      }),
    });
  });
}

// Localizadores robustos baseados em roles dos cards V3 (h3 + link wrapper).
const cardByName = (page: Page, name: string) =>
  page.getByRole("link", { name: new RegExp(name) });

test.describe("Templates V3 — grid de cards + favoritos", () => {
  test("renderiza cards (não tabela) e clique no card abre editor", async ({ page }) => {
    await seed(page);
    await installStubs(page);

    await page.goto("/treinos", { waitUntil: "domcontentloaded" });

    // Cards renderizam como <a role=link> envolvendo o conteúdo
    await expect(cardByName(page, "Hipertrofia ABC")).toBeVisible();
    await expect(cardByName(page, "Emagrecimento HIIT")).toBeVisible();
    await expect(cardByName(page, "Full Body 3x")).toBeVisible();
    await expect(cardByName(page, "Reabilitação Joelho")).toBeVisible();

    // Pills de filtro por objetivo (Wave A)
    await expect(page.getByRole("button", { name: "Todos", exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Hipertrofia", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Emagrecimento", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Reabilitação", exact: true }),
    ).toBeVisible();

    // Card é clicável inteiro: clica e navega
    await cardByName(page, "Hipertrofia ABC").click();
    await page.waitForURL("**/treinos/tpl-hipertrofia", { timeout: 5000 });
    expect(page.url()).toContain("/treinos/tpl-hipertrofia");
  });

  test("filtro por pill de objetivo esconde templates fora do match", async ({ page }) => {
    await seed(page);
    await installStubs(page);

    await page.goto("/treinos", { waitUntil: "domcontentloaded" });
    await expect(cardByName(page, "Hipertrofia ABC")).toBeVisible();
    await expect(cardByName(page, "Reabilitação Joelho")).toBeVisible();

    // Filtra apenas Reabilitação
    await page.getByRole("button", { name: "Reabilitação", exact: true }).click();
    await expect(cardByName(page, "Reabilitação Joelho")).toBeVisible();
    await expect(cardByName(page, "Hipertrofia ABC")).toBeHidden();
    await expect(cardByName(page, "Emagrecimento HIIT")).toBeHidden();

    // Volta pra Todos
    await page.getByRole("button", { name: "Todos", exact: true }).click();
    await expect(cardByName(page, "Hipertrofia ABC")).toBeVisible();
    await expect(cardByName(page, "Emagrecimento HIIT")).toBeVisible();
  });

  test("estrela de favorito persiste via localStorage entre navegações", async ({ page }) => {
    await seed(page);
    await installStubs(page);
    await page.goto("/treinos", { waitUntil: "domcontentloaded" });

    const card = cardByName(page, "Hipertrofia ABC");
    const star = card.getByRole("button", { name: "Favoritar template" });
    await expect(star).toBeVisible();
    await star.click();

    // Após click, label muda pra "Remover dos favoritos"
    await expect(
      card.getByRole("button", { name: "Remover dos favoritos" }),
    ).toBeVisible();

    // localStorage tem o ID persistido
    const stored = await page.evaluate(() =>
      window.localStorage.getItem("treinos:favoritos:v1"),
    );
    expect(stored).toContain("tpl-hipertrofia");

    // Reload — favorito persiste
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(
      cardByName(page, "Hipertrofia ABC").getByRole("button", {
        name: "Remover dos favoritos",
      }),
    ).toBeVisible();

    // Toggle filtro "Favoritos" mostra só esse card
    await page.getByRole("button", { name: "Favoritos", exact: true }).click();
    await expect(cardByName(page, "Hipertrofia ABC")).toBeVisible();
    await expect(cardByName(page, "Emagrecimento HIIT")).toBeHidden();
  });
});
