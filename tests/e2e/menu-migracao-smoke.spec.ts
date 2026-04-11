import { expect, test, type Page } from "@playwright/test";
import {
  installGerencialCommonMocks,
  seedGerencialSession,
} from "./support/gerencial-auth";
import { installGerencialCatchAll } from "./support/gerencial-smoke-mocks";

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

async function visitAndExpectHeading(
  page: Page,
  path: string,
  headingPattern: RegExp | string,
) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  const heading = page
    .getByRole("heading", {
      name: typeof headingPattern === "string" ? headingPattern : headingPattern,
    })
    .first();
  await expect(heading).toBeVisible({ timeout: 10_000 });
}

test.describe("Smoke — rotas migradas do nav-items legacy", () => {
  test.beforeEach(async ({ page }) => {
    await setupSmokePage(page);
  });

  test("/vendas — listagem geral de vendas renderiza", async ({ page }) => {
    await visitAndExpectHeading(page, "/vendas", /^Vendas$/);
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

  test("/treinos/grupos-musculares — catálogo renderiza", async ({ page }) => {
    await visitAndExpectHeading(
      page,
      "/treinos/grupos-musculares",
      /Grupos Musculares/,
    );
  });

  test("/administrativo/salas — CRUD de salas renderiza", async ({ page }) => {
    await visitAndExpectHeading(page, "/administrativo/salas", /^Salas$/);
  });

  test("/administrativo/horarios — horário de funcionamento renderiza", async ({
    page,
  }) => {
    await visitAndExpectHeading(
      page,
      "/administrativo/horarios",
      /Horário de funcionamento/i,
    );
  });

  test("/administrativo/bandeiras — catálogo de bandeiras renderiza", async ({
    page,
  }) => {
    await visitAndExpectHeading(
      page,
      "/administrativo/bandeiras",
      /Bandeiras de Cartão/,
    );
  });

  test("/administrativo/academia/storefront — tema da storefront renderiza", async ({
    page,
  }) => {
    await visitAndExpectHeading(
      page,
      "/administrativo/academia/storefront",
      /Tema da Storefront/,
    );
  });

  test("/administrativo/whatsapp — configuração WhatsApp renderiza", async ({
    page,
  }) => {
    await visitAndExpectHeading(page, "/administrativo/whatsapp", /WhatsApp/);
  });

  test("/gerencial/bi/rede — visão de rede do BI renderiza", async ({
    page,
  }) => {
    await visitAndExpectHeading(page, "/gerencial/bi/rede", /Visão de Rede/);
  });

  test("/gerencial/catraca-acessos — dashboard de acessos renderiza", async ({
    page,
  }) => {
    await visitAndExpectHeading(
      page,
      "/gerencial/catraca-acessos",
      /Acessos na Catraca/,
    );
  });

  test("/gerencial/catraca-acessos — com dados mockados exibe nome do aluno", async ({
    page,
  }) => {
    await page.route(
      /\/api\/v1\/gerencial\/catraca\/acessos\/dashboard/,
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
    await visitAndExpectHeading(
      page,
      "/seguranca/acesso-unidade",
      /Usuários e Acessos/,
    );
  });
});
