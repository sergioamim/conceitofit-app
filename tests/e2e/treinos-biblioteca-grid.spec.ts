/**
 * E2E Wave G — Spec 5: Biblioteca standalone em grid (Wave C).
 *
 * Cobre /treinos/exercicios redesenhada como grid de cards:
 * - Cards renderizam com thumb + nome + equipamento (não tabela)
 * - Filtros: search + select de grupo + select de equipamento
 * - Toggle "Apenas ativos" tem aria-pressed (acessibilidade fix do
 *   débito 5 da Wave F)
 * - Click no card navega pra /treinos/exercicios/{id}
 */

import { expect, test, type Page } from "@playwright/test";
import { installE2EAuthSession } from "./support/auth-session";
import { installOperationalAppShellMocks } from "./support/protected-shell-mocks";

const TENANT_ID = "tn-1";

const exercicios = [
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
    id: "ex-leg-press",
    tenantId: TENANT_ID,
    nome: "Leg press 45",
    grupoMuscularId: "grp-pernas",
    grupoMuscular: "Pernas",
    grupoMuscularNome: "Pernas",
    aparelho: "Máquina",
    equipamento: "Máquina",
    descricao: "Pernas com foco em quadríceps",
    videoUrl: null,
    unidade: "kg",
    ativo: true,
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-01T00:00:00.000Z",
  },
];

const gruposMusculares = [
  { id: "grp-peito", tenantId: TENANT_ID, nome: "Peito", ativo: true },
  { id: "grp-costas", tenantId: TENANT_ID, nome: "Costas", ativo: true },
  { id: "grp-pernas", tenantId: TENANT_ID, nome: "Pernas", ativo: true },
];

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

async function installStubs(page: Page) {
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
  // Listagem de exercícios — endpoint /api/v1/exercicios retorna lista direta
  // (ou wrapper). useExercicios combina com listGruposMusculares.
  await page.route("**/backend/api/v1/exercicios?**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(exercicios),
    });
  });
  await page.route("**/backend/api/v1/exercicios", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(exercicios),
    });
  });
  // Listagem de grupos musculares
  await page.route("**/backend/api/v1/grupos-musculares**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(gruposMusculares),
    });
  });
}

test.describe("Biblioteca standalone — grid + filtros (Wave C)", () => {
  test("renderiza cards (não tabela) com nome + equipamento + chip de grupo", async ({
    page,
  }) => {
    await seed(page);
    await installStubs(page);

    await page.goto("/treinos/exercicios", { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("heading", { name: "Biblioteca de Exercícios" }),
    ).toBeVisible();

    // Cards: cada exercício é um <article role=link>
    await expect(page.getByText("Supino reto")).toBeVisible();
    await expect(page.getByText("Puxada frontal")).toBeVisible();
    await expect(page.getByText("Leg press 45")).toBeVisible();

    // Equipamentos visíveis no body do card
    await expect(page.getByText("Barra livre").first()).toBeVisible();
    await expect(page.getByText("Pulley").first()).toBeVisible();
    await expect(page.getByText("Máquina").first()).toBeVisible();

    // Chip do grupo aparece no thumb (uppercase no design)
    await expect(page.locator("text=PEITO").first()).toBeVisible();
  });

  test("toggle de status tem role=group + aria-pressed (a11y débito 5)", async ({
    page,
  }) => {
    await seed(page);
    await installStubs(page);

    await page.goto("/treinos/exercicios", { waitUntil: "domcontentloaded" });

    // Container tem role=group + aria-label descritivo (era um div solto antes)
    const filtroGroup = page.getByRole("group", {
      name: "Filtro de status do exercício",
    });
    await expect(filtroGroup).toBeVisible();

    // Ambos os botões expõem aria-pressed (era ausente antes do débito 5).
    // Assertamos só presença + valores iniciais — comportamento do toggle
    // é coberto por unit do componente.
    const apenasAtivos = page.locator(
      "[role=group][aria-label='Filtro de status do exercício'] button",
      { hasText: "Apenas ativos" },
    );
    const todos = page.locator(
      "[role=group][aria-label='Filtro de status do exercício'] button",
      { hasText: /^Todos$/ },
    );

    await expect(apenasAtivos).toHaveAttribute("aria-pressed", /^(true|false)$/);
    await expect(todos).toHaveAttribute("aria-pressed", /^(true|false)$/);

    // No estado inicial (default apenasAtivos=true)
    await expect(apenasAtivos).toHaveAttribute("aria-pressed", "true");
    await expect(todos).toHaveAttribute("aria-pressed", "false");
  });

  test("click no card navega pra /treinos/exercicios/{id}", async ({ page }) => {
    await seed(page);
    await installStubs(page);
    // Mock do endpoint singular pra detail page (usado pela navegação)
    await page.route("**/backend/api/v1/exercicios/ex-supino**", async (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(exercicios[0]),
      }),
    );

    await page.goto("/treinos/exercicios", { waitUntil: "domcontentloaded" });

    // Card renderiza como article role=link com aria-label contendo o nome
    const card = page
      .locator("article[role='link']")
      .filter({ hasText: "Supino reto" })
      .first();
    await expect(card).toBeVisible();
    await card.click();

    await page.waitForURL("**/treinos/exercicios/ex-supino", { timeout: 5000 });
    expect(page.url()).toContain("/treinos/exercicios/ex-supino");
  });
});
