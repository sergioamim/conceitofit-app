/**
 * E2E Wave G — Spec 2: Detalhe do exercício usa fetch singular.
 *
 * Cobre regressão do débito 3 (Wave F): a página de detalhe usava
 * listExerciciosApi+find pra pegar 1 item — agora deve fazer GET
 * /api/v1/exercicios/{id} singular via React Query.
 *
 * Verifica:
 * - exatamente 1 chamada singular pra GET /api/v1/exercicios/{id}
 * - lista geral NÃO é chamada na página de detalhe
 * - dados (nome, equipamento, grupo) renderizados
 * - placeholder de "Como executar" / "Erros comuns" aparecem mesmo
 *   sem descrição cadastrada
 */

import { expect, test, type Page } from "@playwright/test";
import { installE2EAuthSession } from "./support/auth-session";
import { installOperationalAppShellMocks } from "./support/protected-shell-mocks";

const EX_ID = "ex-supino-reto";
const EX_FIXTURE = {
  id: EX_ID,
  tenantId: "tn-1",
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
  updatedAt: "2026-04-20T00:00:00.000Z",
};

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

async function installAuthMocks(page: Page) {
  await page.route("**/backend/api/v1/auth/me", async (route) =>
    route.fulfill({
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
    }),
  );
  await page.route("**/backend/api/v1/context/unidade-ativa", async (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        currentTenantId: "tn-1",
        tenantAtual: { id: "tn-1", academiaId: "acd-1", nome: "Unidade Centro", ativo: true },
        unidadesDisponiveis: [
          { id: "tn-1", academiaId: "acd-1", nome: "Unidade Centro", ativo: true },
        ],
      }),
    }),
  );
}

test.describe("Detalhe do exercício — fetch singular", () => {
  test("faz GET /api/v1/exercicios/{id} singular e NÃO chama listagem", async ({
    page,
  }) => {
    await seed(page);
    await installAuthMocks(page);

    const singularCalls: string[] = [];
    const listCalls: string[] = [];

    // GET singular — endpoint que a refator agora usa
    await page.route(`**/backend/api/v1/exercicios/${EX_ID}**`, async (route) => {
      if (route.request().method() === "GET") {
        singularCalls.push(route.request().url());
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(EX_FIXTURE),
      });
    });

    // Lista geral — se for chamada, é regressão (foi removida na Wave F)
    await page.route("**/backend/api/v1/exercicios?**", async (route) => {
      if (route.request().method() === "GET") {
        listCalls.push(route.request().url());
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([EX_FIXTURE]),
      });
    });

    await page.goto(`/treinos/exercicios/${EX_ID}`, { waitUntil: "domcontentloaded" });

    // Espera o nome aparecer (vem do fetch) — aparece em breadcrumb +
    // card lateral; valida só que renderizou
    await expect(page.getByText("Supino reto").first()).toBeVisible();

    // Conferimos os dados — equipamento, grupo
    await expect(page.getByText("Barra livre").first()).toBeVisible();
    await expect(page.getByText("Peito").first()).toBeVisible();

    // Sugestões padrão (textos do design não dependem de descrição)
    await expect(page.getByText("3-4 × 8-12")).toBeVisible();
    await expect(page.getByText("2-0-1")).toBeVisible();

    // Como executar — quando descricao=null mostra os 5 passos genéricos
    await expect(page.getByText(/Posicione-se no/)).toBeVisible();
    await expect(page.getByText("Como executar")).toBeVisible();

    // Erros comuns aparecem com X em vermelho
    await expect(page.getByText("Acelerar a fase excêntrica")).toBeVisible();

    // CRÍTICO: deve ter chamado o singular pelo menos 1 vez e
    // a lista 0 vezes (regressão check)
    expect(singularCalls.length).toBeGreaterThanOrEqual(1);
    expect(listCalls).toEqual([]);
  });

  test("renderiza iframe de vídeo quando videoUrl é YouTube", async ({ page }) => {
    await seed(page);
    await installAuthMocks(page);
    await page.route(`**/backend/api/v1/exercicios/${EX_ID}**`, async (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...EX_FIXTURE,
          videoUrl: "https://youtu.be/dQw4w9WgXcQ",
        }),
      }),
    );

    await page.goto(`/treinos/exercicios/${EX_ID}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Supino reto").first()).toBeVisible();

    // Iframe com URL embed do YouTube
    const iframe = page.locator(
      'iframe[title="Vídeo demonstração: Supino reto"]',
    );
    await expect(iframe).toBeVisible();
    await expect(iframe).toHaveAttribute(
      "src",
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    );
  });

  test("usa midiaUrl como fallback quando não há videoUrl (GIF do catálogo)", async ({
    page,
  }) => {
    await seed(page);
    await installAuthMocks(page);
    await page.route(`**/backend/api/v1/exercicios/${EX_ID}**`, async (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...EX_FIXTURE,
          videoUrl: null,
          midiaUrl: "https://example.com/gif/supino.gif",
        }),
      }),
    );

    await page.goto(`/treinos/exercicios/${EX_ID}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Supino reto").first()).toBeVisible();

    // Sem iframe; img com a midiaUrl
    await expect(page.locator("iframe")).toHaveCount(0);
    const img = page.locator('img[alt="Demonstração: Supino reto"]');
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute("src", "https://example.com/gif/supino.gif");
  });

  test("placeholder com chip do grupo quando não há mídia alguma", async ({
    page,
  }) => {
    await seed(page);
    await installAuthMocks(page);
    await page.route(`**/backend/api/v1/exercicios/${EX_ID}**`, async (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...EX_FIXTURE,
          videoUrl: null,
          midiaUrl: null,
          thumbnailUrl: null,
        }),
      }),
    );

    await page.goto(`/treinos/exercicios/${EX_ID}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Supino reto").first()).toBeVisible();

    // Sem iframe e sem img — só placeholder
    await expect(page.locator("iframe")).toHaveCount(0);
    await expect(page.locator('img[alt^="Demonstração"]')).toHaveCount(0);
    await expect(page.getByText("vídeo demonstrativo")).toBeVisible();
    // Chip do grupo aparece no canto do placeholder
    await expect(page.getByText("Peito", { exact: true }).first()).toBeVisible();
  });

  test("CTA 'Usar em um treino' navega pra /treinos", async ({ page }) => {
    await seed(page);
    await installAuthMocks(page);
    await page.route(`**/backend/api/v1/exercicios/${EX_ID}**`, async (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(EX_FIXTURE),
      }),
    );

    await page.goto(`/treinos/exercicios/${EX_ID}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Supino reto").first()).toBeVisible();

    // CTA tem novo texto após Wave F (era "Adicionar a treino", virou
    // "Usar em um treino" pra ser honesto sobre o fluxo)
    const cta = page.getByRole("link", { name: /Usar em um treino/ });
    await expect(cta).toBeVisible();
    await cta.click();
    await page.waitForURL("**/treinos", { timeout: 5000 });
    expect(page.url()).toMatch(/\/treinos\/?$/);
  });
});
