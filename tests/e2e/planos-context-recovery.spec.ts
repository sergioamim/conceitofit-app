import { expect, test, type Page, type Route } from "@playwright/test";
import { seedAuthenticatedSession } from "./support/backend-only-stubs";
import { installOperationalAppShellMocks } from "./support/protected-shell-mocks";

const TENANT = {
  id: "tenant-planos",
  nome: "Unidade Planos",
  academiaId: "academia-planos",
  groupId: "academia-planos",
  ativo: true,
  branding: {
    appName: "Conceito Fit Planos",
  },
};

async function fulfillJson(route: Route, json: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify(json),
  });
}

async function installPlanosRecoveryMocks(page: Page) {
  let contextSyncCount = 0;
  let planosFailureCount = 0;

  await installOperationalAppShellMocks(page, {
    currentTenantId: TENANT.id,
    tenants: [TENANT],
    user: {
      id: "user-planos",
      userId: "user-planos",
      nome: "Operador Planos",
      displayName: "Operador Planos",
      email: "planos@academia.local",
      roles: ["ADMIN"],
      userKind: "COLABORADOR",
      activeTenantId: TENANT.id,
      tenantBaseId: TENANT.id,
      availableTenants: [{ tenantId: TENANT.id, defaultTenant: true }],
      availableScopes: ["UNIDADE"],
      broadAccess: false,
      redeId: TENANT.academiaId,
      redeNome: "Academia Planos",
      redeSlug: "academia-planos",
    },
    academia: {
      id: TENANT.academiaId,
      nome: "Academia Planos",
      ativo: true,
    },
    routes: {
      tenantContext: false,
      academia: false,
      authRefresh: true,
      onboardingStatus: true,
    },
  });

  await page.route("**/api/v1/context/unidade-ativa**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/backend/, "");

    if (request.method() === "GET" && path === "/api/v1/context/unidade-ativa") {
      await fulfillJson(route, {
        currentTenantId: TENANT.id,
        tenantAtual: TENANT,
        unidadesDisponiveis: [TENANT],
      });
      return;
    }

    const match = path.match(/^\/api\/v1\/context\/unidade-ativa\/([^/]+)$/);
    if (request.method() === "PUT" && match) {
      contextSyncCount += 1;
      await fulfillJson(route, {
        currentTenantId: decodeURIComponent(match[1] ?? TENANT.id),
        tenantAtual: TENANT,
        unidadesDisponiveis: [TENANT],
      });
      return;
    }

    await fulfillJson(route, { message: `Unhandled ${request.method()} ${path}` }, 404);
  });

  await page.route("**/api/v1/academia", async (route) => {
    await fulfillJson(route, {
      id: TENANT.academiaId,
      nome: "Academia Planos",
      ativo: true,
      branding: TENANT.branding,
    });
  });

  await page.route("**/api/v1/comercial/planos**", async (route) => {
    if (route.request().method() !== "GET") {
      await fulfillJson(route, { message: "Método não suportado" }, 405);
      return;
    }

    if (planosFailureCount === 0) {
      planosFailureCount += 1;
      await fulfillJson(
        route,
        {
          message: "X-Context-Id sem unidade ativa. Consulte /api/v1/context/unidade-ativa primeiro",
        },
        400
      );
      return;
    }

    await fulfillJson(route, [
      {
        id: "plano-gold",
        tenantId: TENANT.id,
        nome: "Plano Gold",
        tipo: "MENSAL",
        duracaoDias: 30,
        valor: 199.9,
        valorMatricula: 59.9,
        cobraAnuidade: false,
        permiteRenovacaoAutomatica: true,
        permiteCobrancaRecorrente: true,
        diaCobrancaPadrao: 5,
        contratoAssinatura: "DIGITAL",
        contratoEnviarAutomaticoEmail: true,
        beneficios: ["Musculação", "Aulas coletivas"],
        ativo: true,
        destaque: true,
      },
    ]);
  });

  return {
    get contextSyncCount() {
      return contextSyncCount;
    },
    get planosFailureCount() {
      return planosFailureCount;
    },
  };
}

test.describe("Planos shell recovery", () => {
  test("recupera contexto operacional sem hydration overlay nem erro runtime na listagem", async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });
    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    const mocks = await installPlanosRecoveryMocks(page);
    await seedAuthenticatedSession(page, {
      tenantId: TENANT.id,
      tenantName: TENANT.nome,
      availableTenants: [{ tenantId: TENANT.id, defaultTenant: true }],
    });

    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });
    await page.goto("/planos", { waitUntil: "domcontentloaded" });
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });

    await expect(page.getByRole("heading", { name: "Planos" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Plano Gold").first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("body")).toContainText(TENANT.nome);
    await expect(page.locator("body")).not.toContainText(
      "Hydration failed because the server rendered HTML didn't match the client"
    );
    await expect(page.locator("body")).not.toContainText("X-Context-Id sem unidade ativa");

    expect(mocks.planosFailureCount).toBe(1);
    expect(mocks.contextSyncCount).toBe(1);
    expect(
      consoleErrors.filter(
        (message) =>
          message.includes("Hydration failed") ||
          message.includes("X-Context-Id sem unidade ativa")
      )
    ).toEqual([]);
    expect(pageErrors).toEqual([]);
  });
});
