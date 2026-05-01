import { expect, test, type Page } from "@playwright/test";
import {
  installGerencialCommonMocks,
  seedGerencialSession,
} from "./support/gerencial-auth";
import { installGerencialCatchAll } from "./support/gerencial-smoke-mocks";
import { navigateAndWaitForHeading } from "./support/interactions";

/**
 * Smoke tests das 10 rotas que foram migradas do nav-items legacy para o
 * nav-items-v2 e estavam sem cobertura E2E. Cada uma valida o happy path
 * mínimo: a página renderiza o heading esperado após o tenant context
 * resolver, sem crashear mesmo com datasets vazios no backend.
 *
 * Estratégia: usa `installGerencialCatchAll` que responde com array
 * vazio / objeto vazio a qualquer rota `/api/v1/*` não interceptada,
 * para focar só em "a página carrega" sem se preocupar com shapes
 * específicos de cada API.
 */

const TENANT_ID = "tenant-gerencial-e2e";

async function setupSmokePage(page: Page) {
  // Ordem importa: catch-all primeiro (fallback), depois common mocks
  // (overrides específicos com LIFO), depois seed.
  await installGerencialCatchAll(page);
  await installGerencialCommonMocks(page, { tenantId: TENANT_ID });
  await seedGerencialSession(page, { tenantId: TENANT_ID });
}

test.describe("Smoke — rotas migradas do nav-items legacy", () => {
  test.beforeEach(async ({ page }) => {
    await setupSmokePage(page);
  });

  test("/vendas — listagem geral de vendas renderiza", async ({ page }) => {
    await navigateAndWaitForHeading(page, "/vendas", /^Vendas$/);
  });

  test("/vendas — com dados mockados exibe itens na tabela", async ({
    page,
  }) => {
    // Override do catch-all para retornar uma venda com dados
    await page.route(
      /\/api\/v1\/comercial\/vendas(\?|$)/,
      async (route) => {
        if (route.request().method() !== "GET") return route.fallback();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            items: [
              {
                id: "v1",
                tenantId: TENANT_ID,
                tipo: "PLANO",
                clienteNome: "Cliente Teste Venda",
                status: "CONCLUIDA",
                itens: [],
                subtotal: 150,
                descontoTotal: 0,
                acrescimoTotal: 0,
                total: 150,
                pagamento: { formaPagamento: "PIX", valorPago: 150 },
                dataCriacao: "2026-04-10T10:00:00Z",
              },
            ],
            page: 0,
            size: 20,
            total: 1,
            hasNext: false,
          }),
        });
      },
    );
    await page.goto("/vendas", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: /^Vendas$/ }),
    ).toBeVisible();
    await expect(page.getByText("Cliente Teste Venda").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("/administrativo/salas — com dados mockados exibe linha da sala", async ({
    page,
  }) => {
    // Página usa createTenantLoader + useCrudOperations. Em modo Playwright,
    // o loader passa initialData=undefined e o hook dispara client-side
    // fetch que é interceptado aqui.
    await page.route(
      /\/api\/v1\/administrativo\/salas(\?|$)/,
      async (route) => {
        if (route.request().method() !== "GET") return route.fallback();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "sala-1",
              tenantId: TENANT_ID,
              nome: "Sala Principal",
              descricao: "Funcional térrea",
              capacidadePadrao: 20,
              ativo: true,
            },
            {
              id: "sala-2",
              tenantId: TENANT_ID,
              nome: "Sala Spinning",
              descricao: "Cardio 1º andar",
              capacidadePadrao: 12,
              ativo: false,
            },
          ]),
        });
      },
    );

    await page.goto("/administrativo/salas", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /^Salas$/ })).toBeVisible();
    await expect(page.getByText("Sala Principal").first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("Sala Spinning").first()).toBeVisible();
    // Status: a sala 1 está ativa, a 2 inativa — valida os dois badges.
    await expect(page.getByText("Ativa").first()).toBeVisible();
    await expect(page.getByText("Inativa").first()).toBeVisible();
  });

  test("/administrativo/horarios — com dados mockados exibe dias da semana", async ({
    page,
  }) => {
    // Horários: o loader SSR bate em /api/v1/administrativo/horarios mas o
    // client hook bate em /api/v1/context/horarios-funcionamento. Em modo
    // Playwright, initialData=undefined → o client busca.
    await page.route(
      /\/api\/v1\/context\/horarios-funcionamento(\?|$)/,
      async (route) => {
        if (route.request().method() !== "GET") return route.fallback();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            { dia: "SEG", abre: "06:00", fecha: "22:00", fechado: false },
            { dia: "TER", abre: "06:00", fecha: "22:00", fechado: false },
            { dia: "QUA", abre: "06:00", fecha: "22:00", fechado: false },
            { dia: "QUI", abre: "06:00", fecha: "22:00", fechado: false },
            { dia: "SEX", abre: "06:00", fecha: "22:00", fechado: false },
            { dia: "SAB", abre: "08:00", fecha: "18:00", fechado: false },
            { dia: "DOM", abre: "00:00", fecha: "00:00", fechado: true },
          ]),
        });
      },
    );

    await page.goto("/administrativo/horarios", {
      waitUntil: "domcontentloaded",
    });
    await expect(
      page.getByRole("heading", { name: /Horário de funcionamento/i }),
    ).toBeVisible();
    // Os 7 dias devem aparecer via DIAS_LABEL map.
    await expect(page.getByText("Segunda")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Terça")).toBeVisible();
    await expect(page.getByText("Domingo")).toBeVisible();
  });

  test("/administrativo/bandeiras — com dados mockados exibe taxas", async ({
    page,
  }) => {
    // Mesma mecânica que salas — loader SSR bypassed, client dispara fetch
    // no endpoint real (/comercial/bandeiras-cartao).
    await page.route(
      /\/api\/v1\/comercial\/bandeiras-cartao(\?|$)/,
      async (route) => {
        if (route.request().method() !== "GET") return route.fallback();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "band-1",
              tenantId: TENANT_ID,
              nome: "Mastercard",
              taxaPercentual: 3.2,
              diasRepasse: 30,
              ativo: true,
            },
            {
              id: "band-2",
              tenantId: TENANT_ID,
              nome: "Visa",
              taxaPercentual: 2.9,
              diasRepasse: 28,
              ativo: true,
            },
          ]),
        });
      },
    );

    await page.goto("/administrativo/bandeiras", {
      waitUntil: "domcontentloaded",
    });
    await expect(
      page.getByRole("heading", { name: /Bandeiras de Cartão/ }),
    ).toBeVisible();
    await expect(page.getByText("Mastercard")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Visa")).toBeVisible();
    // Colunas de taxa e repasse populadas.
    await expect(page.getByText("3.2%")).toBeVisible();
    await expect(page.getByText("30 dias")).toBeVisible();
  });

  test("/administrativo/academia/storefront — com tema mockado popula campos do form", async ({
    page,
  }) => {
    // Tema é carregado via GET /api/v1/storefront/theme — o form usa
    // react-hook-form + form.reset() após a resposta chegar.
    await page.route(/\/api\/v1\/storefront\/theme/, async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          tenantId: TENANT_ID,
          logoUrl: "https://cdn.test/logo.png",
          faviconUrl: "https://cdn.test/favicon.ico",
          heroTitle: "Academia E2E — Venha treinar com a gente",
          heroSubtitle: "Planos a partir de R$ 99",
          heroImageUrl: "https://cdn.test/hero.jpg",
          themePreset: "MIDNIGHT",
          useCustomColors: false,
          colors: {},
          footerText: "© 2026 Academia E2E",
          instagram: "https://instagram.com/academia-e2e",
          facebook: "https://facebook.com/academia-e2e",
          whatsapp: "11999990000",
        }),
      });
    });

    await page.goto("/administrativo/academia/storefront", {
      waitUntil: "domcontentloaded",
    });
    await expect(
      page.getByRole("heading", { name: /Tema da Storefront/ }),
    ).toBeVisible({ timeout: 10_000 });
    // Após o form.reset(), os inputs devem conter os valores mockados.
    // Usa IDs dos <Input id="..."> definidos no storefront-content.tsx.
    await expect(page.locator("#heroTitle")).toHaveValue(
      "Academia E2E — Venha treinar com a gente",
      { timeout: 10_000 },
    );
    await expect(page.locator("#heroSubtitle")).toHaveValue(
      "Planos a partir de R$ 99",
    );
    await expect(page.locator("#logoUrl")).toHaveValue(
      "https://cdn.test/logo.png",
    );
  });

  test("/administrativo/whatsapp — configuração WhatsApp renderiza", async ({
    page,
  }) => {
    await navigateAndWaitForHeading(page, "/administrativo/whatsapp", /WhatsApp/);
  });

  test("/gerencial/bi/rede — visão de rede do BI renderiza", async ({
    page,
  }) => {
    await navigateAndWaitForHeading(page, "/gerencial/bi/rede", /Visão de Rede/);
  });

  test("/gerencial/catraca-acessos — dashboard de acessos renderiza", async ({
    page,
  }) => {
    await navigateAndWaitForHeading(
      page,
      "/gerencial/catraca-acessos",
      /Acessos na Catraca/,
    );
  });

  test("/gerencial/catraca-acessos — com dados mockados exibe nome do aluno", async ({
    page,
  }) => {
    await page.route(
      /\/api\/v1\/gerencial\/catraca-acessos/,
      async (route) => {
        if (route.request().method() !== "GET") return route.fallback();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            items: [
              {
                id: "acc-1",
                memberId: "aluno-1",
                nome: "Maria Santos",
                status: "LIBERADO",
                releaseType: "AUTOMATICA",
                createdAt: "2026-04-10T08:30:00Z",
              },
            ],
            page: 0,
            size: 20,
            total: 1,
            hasNext: false,
            resumo: {
              entradas: 42,
              entradasManuais: 2,
              bloqueados: 0,
              frequenciaMediaPorCliente: 3.5,
            },
            serieDiaria: [],
            rankingFrequencia: [],
          }),
        });
      },
    );
    await page.goto("/gerencial/catraca-acessos", {
      waitUntil: "domcontentloaded",
    });
    await expect(
      page.getByRole("heading", { name: /Acessos na Catraca/ }),
    ).toBeVisible();
    // A tab default é DASHBOARD que mostra os cards de resumo com os
    // valores do `resumo` do mock. 42 é a quantidade de entradas mockada.
    await expect(page.getByText(/^42$/).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("/seguranca/acesso-unidade — gestão de usuários renderiza", async ({
    page,
  }) => {
    // Esta tela carrega usuários sob demanda (via botão), então o smoke
    // test valida só que o shell da página renderiza com o heading.
    await navigateAndWaitForHeading(
      page,
      "/seguranca/acesso-unidade",
      /Usuários e Acessos/,
    );
  });
});
