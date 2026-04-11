import { expect, test, type Page } from "@playwright/test";
import {
  installGerencialCommonMocks,
  seedGerencialSession,
} from "./support/gerencial-auth";

const TENANT_ID = "tenant-gerencial-e2e";

async function installNpsMocks(
  page: Page,
  options: {
    dashboard?: {
      tenantId: string;
      inicio: string;
      fim: string;
      totalRespostas: number;
      promotores: number;
      neutros: number;
      detratores: number;
      npsScore: number;
      notaMedia: number;
      itensCriticos: unknown[];
    };
    envios?: unknown[];
    campanhas?: unknown[];
  } = {},
) {
  await page.route(/\/api\/v1\/retencao\/nps\/dashboard/, async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        options.dashboard ?? {
          tenantId: TENANT_ID,
          inicio: "2026-04-01",
          fim: "2026-04-30",
          totalRespostas: 50,
          promotores: 30,
          neutros: 12,
          detratores: 8,
          npsScore: 44,
          notaMedia: 8.2,
          itensCriticos: [],
        },
      ),
    });
  });

  await page.route(/\/api\/v1\/retencao\/nps\/envios/, async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(options.envios ?? []),
    });
  });

  await page.route(/\/api\/v1\/retencao\/nps\/campanhas/, async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(options.campanhas ?? []),
    });
  });
}

async function openNps(page: Page) {
  await installGerencialCommonMocks(page, { tenantId: TENANT_ID });
  await seedGerencialSession(page, { tenantId: TENANT_ID });
  await page.goto("/retencao/nps", { waitUntil: "domcontentloaded" });
}

test.describe("Retenção — NPS Dashboard", () => {
  test("cenário 1: renderiza dashboard com título", async ({ page }) => {
    await installNpsMocks(page, {});
    await openNps(page);

    // O conteúdo usa Suspense — esperamos o h1 de NPS aparecer
    const heading = page.getByRole("heading", { name: /NPS/ }).first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("cenário 2: exibe KPIs quando há respostas", async ({ page }) => {
    await installNpsMocks(page, {
      dashboard: {
        tenantId: TENANT_ID,
        inicio: "2026-04-01",
        fim: "2026-04-30",
        totalRespostas: 100,
        promotores: 60,
        neutros: 25,
        detratores: 15,
        npsScore: 45,
        notaMedia: 8.5,
        itensCriticos: [],
      },
    });
    await openNps(page);

    // NPS score 45 deve aparecer em algum lugar
    await expect(page.getByText(/45/).first()).toBeVisible({ timeout: 10_000 });
  });

  test("cenário 3: exibe estado inicial sem respostas", async ({ page }) => {
    await installNpsMocks(page, {
      dashboard: {
        tenantId: TENANT_ID,
        inicio: "2026-04-01",
        fim: "2026-04-30",
        totalRespostas: 0,
        promotores: 0,
        neutros: 0,
        detratores: 0,
        npsScore: 0,
        notaMedia: 0,
        itensCriticos: [],
      },
    });
    await openNps(page);

    // Ao menos o heading NPS aparece
    await expect(
      page.getByRole("heading", { name: /NPS/ }).first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});
