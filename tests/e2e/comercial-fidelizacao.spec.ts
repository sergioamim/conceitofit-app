import { expect, test, type Page } from "@playwright/test";
import {
  installGerencialCommonMocks,
  seedGerencialSession,
} from "./support/gerencial-auth";

const TENANT_ID = "tenant-gerencial-e2e";

async function installFidelizacaoMocks(
  page: Page,
  options: {
    campanhas?: unknown[];
    indicacoes?: unknown[];
    saldos?: unknown[];
  } = {},
) {
  await page.route(
    /\/api\/v1\/comercial\/fidelizacao\/campanhas/,
    async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(options.campanhas ?? []),
      });
    },
  );

  await page.route(
    /\/api\/v1\/comercial\/fidelizacao\/indicacoes/,
    async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(options.indicacoes ?? []),
      });
    },
  );

  await page.route(
    /\/api\/v1\/comercial\/fidelizacao\/saldos/,
    async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(options.saldos ?? []),
      });
    },
  );
}

async function openFidelizacao(page: Page) {
  await installGerencialCommonMocks(page, { tenantId: TENANT_ID });
  await seedGerencialSession(page, { tenantId: TENANT_ID });
  await page.goto("/comercial/fidelizacao", { waitUntil: "domcontentloaded" });
}

test.describe("Comercial — Fidelização", () => {
  test("cenário 1: renderiza título Fidelização", async ({ page }) => {
    await installFidelizacaoMocks(page, {});
    await openFidelizacao(page);

    await expect(
      page.getByRole("heading", { name: /Fidelização/ }).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("cenário 2: lista campanhas ativas", async ({ page }) => {
    await installFidelizacaoMocks(page, {
      campanhas: [
        {
          id: "camp-fid-1",
          tenantId: TENANT_ID,
          academiaId: TENANT_ID,
          nome: "Programa Indique e Ganhe",
          descricao: "50 pontos por indicação convertida",
          pontosIndicacao: 50,
          pontosConversao: 100,
          ativo: true,
          dataInicio: "2026-01-01",
          dataFim: null,
        },
      ],
      indicacoes: [],
      saldos: [],
    });
    await openFidelizacao(page);

    await expect(page.getByText(/Programa Indique e Ganhe/i)).toBeVisible({
      timeout: 10_000,
    });
  });

  test("cenário 3: estado inicial com dados vazios", async ({ page }) => {
    await installFidelizacaoMocks(page, {
      campanhas: [],
      indicacoes: [],
      saldos: [],
    });
    await openFidelizacao(page);

    await expect(
      page.getByRole("heading", { name: /Fidelização/ }).first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});
