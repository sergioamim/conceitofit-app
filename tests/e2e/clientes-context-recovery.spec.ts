import { expect, test, type Page, type Route } from "@playwright/test";
import { seedAuthenticatedSession } from "./support/backend-only-stubs";

const TENANT = {
  id: "tenant-clientes",
  nome: "Unidade Clientes",
  academiaId: "academia-clientes",
  groupId: "academia-clientes",
  ativo: true,
  branding: {
    appName: "Conceito Fit Clientes",
  },
};

async function fulfillJson(route: Route, json: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify(json),
  });
}

async function installClientesRecoveryMocks(page: Page) {
  let contextSyncCount = 0;
  let alunosFailureCount = 0;

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

  await page.route("**/api/v1/academia**", async (route) => {
    await fulfillJson(route, {
      id: TENANT.academiaId,
      nome: "Academia Clientes",
      ativo: true,
      branding: TENANT.branding,
    });
  });

  await page.route("**/api/v1/comercial/alunos**", async (route) => {
    if (route.request().method() !== "GET") {
      await fulfillJson(route, { message: "Método não suportado" }, 405);
      return;
    }

    if (alunosFailureCount === 0) {
      alunosFailureCount += 1;
      await fulfillJson(
        route,
        {
          message: "X-Context-Id sem unidade ativa. Consulte /api/v1/context/unidade-ativa primeiro",
        },
        400
      );
      return;
    }

    await fulfillJson(route, {
      items: [
        {
          id: "aluno-1",
          tenantId: TENANT.id,
          nome: "Ana Clientes",
          email: "ana@clientes.local",
          telefone: "(11) 99999-0000",
          cpf: "123.456.789-00",
          dataNascimento: "1992-04-10",
          sexo: "F",
          status: "ATIVO",
          pendenteComplementacao: false,
          dataCadastro: "2026-03-01T10:00:00",
        },
      ],
      page: 0,
      size: 20,
      hasNext: false,
      totaisStatus: {
        total: 1,
        totalAtivo: 1,
        totalSuspenso: 0,
        totalInativo: 0,
        totalCancelado: 0,
      },
    });
  });

  await page.route(/.*\/api\/v1\/comercial\/(adesoes|matriculas)(\?.*)?$/, async (route) => {
    await fulfillJson(route, []);
  });

  await page.route("**/api/v1/comercial/planos**", async (route) => {
    await fulfillJson(route, []);
  });

  return {
    get contextSyncCount() {
      return contextSyncCount;
    },
    get alunosFailureCount() {
      return alunosFailureCount;
    },
  };
}

test.describe("Clientes context recovery", () => {
  test("recupera a unidade ativa e renderiza a lista sem overlay de erro", async ({ page }) => {
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

    const mocks = await installClientesRecoveryMocks(page);
    await seedAuthenticatedSession(page, {
      tenantId: TENANT.id,
      tenantName: TENANT.nome,
      availableTenants: [{ tenantId: TENANT.id, defaultTenant: true }],
    });

    await page.goto("/clientes");

    await expect(page.getByRole("heading", { name: "Clientes" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Ana Clientes" })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("X-Context-Id sem unidade ativa");
    await expect(page.locator("body")).not.toContainText(
      "Hydration failed because the server rendered HTML didn't match the client"
    );

    expect(mocks.alunosFailureCount).toBe(1);
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
