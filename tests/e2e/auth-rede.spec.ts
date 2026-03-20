import { expect, test, type Page } from "@playwright/test";

type CapturedBodies = {
  login?: Record<string, unknown>;
  recovery?: Record<string, unknown>;
  firstAccess?: Record<string, unknown>;
};

function normalizedPath(pathname: string) {
  return pathname.replace(/^\/backend/, "");
}

function parseBody(raw: string | null) {
  try {
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

async function installAuthNetworkMocks(page: Page, captured: CapturedBodies) {
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const path = normalizedPath(url.pathname);

    if (path === "/api/v1/auth/rede-contexto" && method === "GET") {
      await route.fulfill({
        status: 200,
        json: {
          id: "rede-1",
          slug: "rede-norte",
          nome: "Rede Norte",
          appName: "Portal Rede Norte",
          supportText: "Use seu e-mail ou CPF no contexto correto da rede.",
          accentLabel: "Rede Norte",
          helpEmail: "suporte@redenorte.local",
        },
      });
      return;
    }

    if (path === "/api/v1/auth/login" && method === "POST") {
      captured.login = parseBody(request.postData());
      await route.fulfill({
        status: 200,
        json: {
          token: "token-rede",
          refreshToken: "refresh-rede",
          type: "Bearer",
          userId: "user-ana",
          displayName: "Ana Admin",
          userKind: "COLABORADOR",
          redeId: "rede-1",
          redeSlug: "rede-norte",
          redeNome: "Rede Norte",
          activeTenantId: "tenant-centro",
          tenantBaseId: "tenant-base",
          availableTenants: [{ tenantId: "tenant-centro", defaultTenant: true }],
          availableScopes: ["REDE"],
          broadAccess: false,
        },
      });
      return;
    }

    if (path === "/api/v1/auth/password/recovery" && method === "POST") {
      captured.recovery = parseBody(request.postData());
      await route.fulfill({
        status: 200,
        json: {
          message: "Instruções enviadas para a rede correta.",
        },
      });
      return;
    }

    if (path === "/api/v1/auth/first-access" && method === "POST") {
      captured.firstAccess = parseBody(request.postData());
      await route.fulfill({
        status: 200,
        json: {
          message: "Convite de primeiro acesso emitido para esta rede.",
        },
      });
      return;
    }

    if (path === "/api/v1/context/unidade-ativa" && method === "GET") {
      await route.fulfill({
        status: 200,
        json: {
          currentTenantId: "tenant-centro",
          tenantAtual: { id: "tenant-centro", nome: "Unidade Centro", ativo: true },
          unidadesDisponiveis: [{ id: "tenant-centro", nome: "Unidade Centro", ativo: true }],
        },
      });
      return;
    }

    if (path === "/api/v1/context/unidade-ativa/tenant-centro" && method === "PUT") {
      await route.fulfill({
        status: 200,
        json: {
          currentTenantId: "tenant-centro",
          tenantAtual: { id: "tenant-centro", nome: "Unidade Centro", ativo: true },
          unidadesDisponiveis: [{ id: "tenant-centro", nome: "Unidade Centro", ativo: true }],
        },
      });
      return;
    }

    if (path === "/api/v1/app/bootstrap" && method === "GET") {
      await route.fulfill({
        status: 200,
        json: {
          user: {
            userId: "user-ana",
            nome: "Ana Admin",
            displayName: "Ana Admin",
            email: "ana@qa.local",
            roles: ["ADMIN"],
            userKind: "COLABORADOR",
            redeId: "rede-1",
            redeSlug: "rede-norte",
            redeNome: "Rede Norte",
            activeTenantId: "tenant-centro",
            tenantBaseId: "tenant-base",
            availableTenants: [{ tenantId: "tenant-centro", defaultTenant: true }],
            availableScopes: ["REDE"],
            broadAccess: false,
          },
          tenantContext: {
            currentTenantId: "tenant-centro",
            tenantAtual: { id: "tenant-centro", nome: "Unidade Centro", ativo: true },
            unidadesDisponiveis: [{ id: "tenant-centro", nome: "Unidade Centro", ativo: true }],
          },
          academia: { id: "academia-norte", nome: "Rede Norte", ativo: true },
        },
      });
      return;
    }

    if (path === "/api/v1/auth/me" && method === "GET") {
      await route.fulfill({
        status: 200,
        json: {
          userId: "user-ana",
          nome: "Ana Admin",
          email: "ana@qa.local",
          roles: ["ADMIN"],
        },
      });
      return;
    }

    if (path === "/api/v1/academia" && method === "GET") {
      await route.fulfill({
        status: 200,
        json: {
          id: "academia-norte",
          nome: "Rede Norte",
          ativo: true,
        },
      });
      return;
    }

    if (path === "/api/v1/academia/dashboard" && method === "GET") {
      await route.fulfill({
        status: 200,
        json: {
          totalAlunosAtivos: 120,
          prospectsNovos: 10,
          matriculasDoMes: 4,
          receitaDoMes: 25000,
          prospectsRecentes: [],
          matriculasVencendo: [],
          pagamentosPendentes: [],
          statusAlunoCount: {
            ATIVO: 120,
            INATIVO: 5,
            SUSPENSO: 1,
            CANCELADO: 2,
          },
        },
      });
      return;
    }

    await route.fulfill({ status: 200, json: {} });
  });
}

test.describe("acesso por rede", () => {
  test("autentica com identifier contextualizado pela rede e segue para o dashboard", async ({ page }) => {
    const captured: CapturedBodies = {};
    await installAuthNetworkMocks(page, captured);

    await page.goto("/acesso/rede-norte/autenticacao?next=%2Fdashboard");

    await expect(page.getByRole("heading", { name: "Portal Rede Norte" })).toBeVisible();
    await expect(page.getByText("Suporte: suporte@redenorte.local")).toBeVisible();

    await page.getByLabel("Identificador").fill("ana@qa.local");
    await page.getByLabel("Senha").fill("12345678");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText("Unidade Centro").first()).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Selecionar unidade ativa" })).toHaveCount(0);

    expect(captured.login).toEqual({
      redeIdentifier: "rede-norte",
      identifier: "ana@qa.local",
      password: "12345678",
      channel: "APP",
    });

    const sessionSnapshot = await page.evaluate(() => ({
      networkSlug: window.localStorage.getItem("academia-auth-network-slug"),
      baseTenantId: window.localStorage.getItem("academia-auth-base-tenant-id"),
      activeTenantId: window.localStorage.getItem("academia-auth-active-tenant-id"),
    }));

    expect(sessionSnapshot).toEqual({
      networkSlug: "rede-norte",
      baseTenantId: "tenant-base",
      activeTenantId: "tenant-centro",
    });
  });

  test("mantém recuperação e primeiro acesso isolados por rede", async ({ page }) => {
    const captured: CapturedBodies = {};
    await installAuthNetworkMocks(page, captured);

    await page.goto("/acesso/rede-norte/recuperar-senha");
    await page.getByLabel("Identificador").fill("ana@qa.local");
    await page.getByRole("button", { name: "Enviar instruções" }).click();
    await expect(page.getByText("Instruções enviadas para a rede correta.")).toBeVisible();

    await page.goto("/acesso/rede-norte/primeiro-acesso");
    await page.getByLabel("Identificador").fill("111.222.333-44");
    await page.getByRole("button", { name: "Solicitar primeiro acesso" }).click();
    await expect(page.getByText("Convite de primeiro acesso emitido para esta rede.")).toBeVisible();

    expect(captured.recovery).toEqual({
      redeIdentifier: "rede-norte",
      identifier: "ana@qa.local",
      channel: "APP",
    });
    expect(captured.firstAccess).toEqual({
      redeIdentifier: "rede-norte",
      identifier: "111.222.333-44",
      channel: "APP",
    });
  });
});
