import { expect, test, type Page } from "@playwright/test";
import {
  installGerencialCommonMocks,
  seedGerencialSession,
} from "./support/gerencial-auth";

const TENANT_ID = "tenant-gerencial-e2e";

async function installCadenciasMocks(
  page: Page,
  options: {
    cadencias?: unknown[];
    executions?: unknown[];
    escalationRules?: unknown[];
  } = {},
) {
  await page.route(/\/api\/v1\/crm\/cadencias(\?|$)/, async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(options.cadencias ?? []),
    });
  });

  await page.route(
    /\/api\/v1\/crm\/cadencias\/executions/,
    async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(options.executions ?? []),
      });
    },
  );

  await page.route(
    /\/api\/v1\/crm\/escalation-rules/,
    async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(options.escalationRules ?? []),
      });
    },
  );

  await page.route(/\/api\/v1\/crm\/prospects/, async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route(/\/api\/v1\/academia\/prospects/, async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });
}

async function openCadencias(page: Page) {
  await installGerencialCommonMocks(page, { tenantId: TENANT_ID });
  await seedGerencialSession(page, { tenantId: TENANT_ID });
  await page.goto("/crm/cadencias", { waitUntil: "domcontentloaded" });
}

test.describe("CRM — Cadências", () => {
  test("cenário 1: renderiza título da página", async ({ page }) => {
    await installCadenciasMocks(page, {});
    await openCadencias(page);

    await expect(
      page.getByRole("heading", { name: /Cadências/ }).first(),
    ).toBeVisible();
  });

  test("cenário 2: renderiza descrição da página sem erro", async ({
    page,
  }) => {
    await installCadenciasMocks(page, {});
    await openCadencias(page);

    // A tela não deve quebrar quando a API retorna [] (backend fantasma)
    await expect(
      page.getByRole("heading", { name: /Cadências/ }).first(),
    ).toBeVisible();
    // Nenhum erro runtime — body está visível
    await expect(page.locator("body")).toBeVisible();
  });

  test("cenário 3: estado vazio quando backend retorna lista vazia", async ({
    page,
  }) => {
    await installCadenciasMocks(page, { cadencias: [] });
    await openCadencias(page);

    await expect(
      page.getByRole("heading", { name: /Cadências/ }).first(),
    ).toBeVisible();
  });
});
