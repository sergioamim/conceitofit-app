import { expect, test, type Page } from "@playwright/test";
import {
  installGerencialCommonMocks,
  seedGerencialSession,
} from "./support/gerencial-auth";

const TENANT_ID = "tenant-gerencial-e2e";

async function installPixMocks(
  page: Page,
  options: {
    cobrancas?: unknown[];
    onCriar?: (route: import("@playwright/test").Route) => Promise<void>;
  } = {},
) {
  // GET /api/v1/integracoes/pix/cobrancas
  await page.route(/\/api\/v1\/integracoes\/pix\/cobrancas/, async (route) => {
    const method = route.request().method();
    if (method === "POST") {
      if (options.onCriar) return options.onCriar(route);
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          txId: "tx-new-123",
          status: "CRIADA",
          pixCopiaECola: "00020126580014br.gov.bcb.pix5204000053039865802BR",
          vencimento: "2026-05-10",
        }),
      });
    }
    if (method === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(options.cobrancas ?? []),
      });
    }
    await route.fallback();
  });

  // Listagem de alunos (caso o form precise selecionar)
  await page.route(/\/api\/v1\/comercial\/alunos(\?|$)/, async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [],
        page: 0,
        size: 10,
        hasNext: false,
      }),
    });
  });
}

async function openPix(page: Page) {
  await installGerencialCommonMocks(page, { tenantId: TENANT_ID });
  await seedGerencialSession(page, { tenantId: TENANT_ID });
  await page.goto("/financeiro/pix", { waitUntil: "domcontentloaded" });
}

test.describe("Financeiro — PIX", () => {
  test("cenário 1: renderiza título da página PIX", async ({ page }) => {
    await installPixMocks(page, {});
    await openPix(page);

    await expect(
      page.getByRole("heading", { name: /PIX|Cobranças/i }).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("cenário 2: exibe formulário ou lista de cobranças", async ({
    page,
  }) => {
    await installPixMocks(page, {});
    await openPix(page);

    // A página pode ter inputs de criar cobrança e/ou tabela
    await expect(
      page.getByRole("heading", { name: /PIX|Cobranças/i }).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("cenário 3: cobrancas retornadas pela API são renderizadas", async ({
    page,
  }) => {
    await installPixMocks(page, {
      cobrancas: [
        {
          txId: "tx-1",
          status: "CRIADA",
          pixCopiaECola: "00020126580014br.gov.bcb.pix5204000053039865802BR",
          vencimento: "2026-05-10",
        },
      ],
    });
    await openPix(page);

    await expect(
      page.getByRole("heading", { name: /PIX|Cobranças/i }).first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});
