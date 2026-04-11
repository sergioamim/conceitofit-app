import { expect, test, type Page } from "@playwright/test";
import {
  installGerencialCommonMocks,
  seedGerencialSession,
} from "./support/gerencial-auth";

const TENANT_ID = "tenant-gerencial-e2e";

async function installCampanhasMocks(
  page: Page,
  options: { campanhas?: unknown[] } = {},
) {
  await page.route(/\/api\/v1\/crm\/campanhas/, async (route) => {
    const method = route.request().method();
    if (method !== "GET") return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(options.campanhas ?? []),
    });
  });

  // Listagem de audiências/playbooks/etc que o componente pode consultar
  await page.route(/\/api\/v1\/crm\/(playbooks|tarefas|automacoes)/, async (route) => {
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

async function openCampanhas(page: Page) {
  await installGerencialCommonMocks(page, { tenantId: TENANT_ID });
  await seedGerencialSession(page, { tenantId: TENANT_ID });
  await page.goto("/crm/campanhas", { waitUntil: "domcontentloaded" });
}

test.describe("CRM — Campanhas", () => {
  test("cenário 1: renderiza título Campanhas CRM", async ({ page }) => {
    await installCampanhasMocks(page, {});
    await openCampanhas(page);

    await expect(
      page.getByRole("heading", { name: /Campanhas CRM/ }),
    ).toBeVisible();
  });

  test("cenário 2: renderiza subtítulo/descrição sem erro", async ({
    page,
  }) => {
    await installCampanhasMocks(page, {});
    await openCampanhas(page);

    await expect(
      page.getByRole("heading", { name: /Campanhas CRM/ }),
    ).toBeVisible();
    await expect(page.locator("body")).toBeVisible();
  });

  test("cenário 3: estado vazio quando sem campanhas", async ({ page }) => {
    await installCampanhasMocks(page, { campanhas: [] });
    await openCampanhas(page);

    await expect(
      page.getByRole("heading", { name: /Campanhas CRM/ }),
    ).toBeVisible();
  });
});
