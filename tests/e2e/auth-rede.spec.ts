import { expect, test, type Page } from "@playwright/test";

type CapturedRequest = {
  body: Record<string, unknown>;
  networkIdentifier?: string;
};

type CapturedRequests = {
  login?: CapturedRequest;
  recovery?: CapturedRequest;
  firstAccess?: CapturedRequest;
  contextIdentifiers: string[];
};

// Contrato atual de rede:
// - Host/subdominio: /login lê x-forwarded-host (ou host) para resolver subdomínio.
// - Rota explícita: /app/[rede]/(login|forgot-password|first-access).
// - Query: /login?redeIdentifier=rede-alvo.
// - Header na API: X-Rede-Identifier.

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

async function installAuthNetworkMocks(
  page: Page,
  captured: CapturedRequests,
  options?: {
    forcePasswordChange?: boolean;
  }
) {
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const path = normalizedPath(url.pathname);
    const networkIdentifier = request.headers()["x-rede-identifier"];

    if (path === "/api/v1/auth/rede-contexto" && method === "GET") {
      captured.contextIdentifiers.push(networkIdentifier ?? "");
      if (networkIdentifier === "rede-invalida") {
        await route.fulfill({
          status: 404,
          json: {
            error: "Not Found",
            message: "Rede inválida.",
          },
        });
        return;
      }

      await route.fulfill({
        status: 200,
        json: {
          id: "rede-1",
          subdomain: "rede-norte",
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
      captured.login = {
        body: parseBody(request.postData()),
        networkIdentifier,
      };
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
          forcePasswordChange: options?.forcePasswordChange === true,
        },
      });
      return;
    }

    if (path === "/api/v1/auth/change-password" && method === "POST") {
      await route.fulfill({
        status: 200,
        json: {
          message: "Senha atualizada com sucesso.",
        },
      });
      return;
    }

    if (path === "/api/v1/auth/forgot-password" && method === "POST") {
      captured.recovery = {
        body: parseBody(request.postData()),
        networkIdentifier,
      };
      await route.fulfill({
        status: 200,
        json: {
          message: "Instruções enviadas para a rede correta.",
        },
      });
      return;
    }

    if (path === "/api/v1/auth/first-access" && method === "POST") {
      captured.firstAccess = {
        body: parseBody(request.postData()),
        networkIdentifier,
      };
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
    const captured: CapturedRequests = { contextIdentifiers: [] };
    await installAuthNetworkMocks(page, captured);

    await page.goto("/app/rede-norte/login?next=%2Fdashboard");

    await expect(page.getByRole("heading", { name: "Portal Rede Norte" })).toBeVisible();
    await expect(page.getByText("Suporte: suporte@redenorte.local")).toBeVisible();
    await expect(page.getByText("Subdomínio: rede-norte")).toBeVisible();

    await page.getByLabel("Identificador").fill("ana@qa.local");
    await page.getByLabel("Senha").fill("12345678");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText("Unidade Centro").first()).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Selecionar unidade ativa" })).toHaveCount(0);

    expect(captured.contextIdentifiers).toEqual(["rede-norte"]);
    expect(captured.login).toEqual({
      networkIdentifier: "rede-norte",
      body: {
        identifier: "ana@qa.local",
        password: "12345678",
        channel: "APP",
      },
    });

    const sessionSnapshot = await page.evaluate(() => ({
      networkSubdomain: window.localStorage.getItem("academia-auth-network-subdomain"),
      networkSlug: window.localStorage.getItem("academia-auth-network-slug"),
      baseTenantId: window.localStorage.getItem("academia-auth-base-tenant-id"),
      activeTenantId: window.localStorage.getItem("academia-auth-active-tenant-id"),
    }));

    expect(sessionSnapshot).toEqual({
      networkSubdomain: "rede-norte",
      networkSlug: "rede-norte",
      baseTenantId: "tenant-base",
      activeTenantId: "tenant-centro",
    });
  });

  test("mantém recuperação e primeiro acesso isolados por rede", async ({ page }) => {
    const captured: CapturedRequests = { contextIdentifiers: [] };
    await installAuthNetworkMocks(page, captured);

    await page.goto("/app/rede-norte/forgot-password");
    await page.getByLabel("Identificador").fill("ana@qa.local");
    await page.getByRole("button", { name: "Enviar instruções" }).click();
    await expect(page.getByText("Instruções enviadas para a rede correta.")).toBeVisible();

    await page.goto("/app/rede-norte/first-access");
    await page.getByLabel("Identificador").fill("111.222.333-44");
    await page.getByRole("button", { name: "Solicitar primeiro acesso" }).click();
    await expect(page.getByText("Convite de primeiro acesso emitido para esta rede.")).toBeVisible();

    expect(captured.recovery).toEqual({
      networkIdentifier: "rede-norte",
      body: {
        identifier: "ana@qa.local",
        channel: "APP",
      },
    });
    expect(captured.firstAccess).toEqual({
      networkIdentifier: "rede-norte",
      body: {
        identifier: "111.222.333-44",
        channel: "APP",
      },
    });
  });

  test("usa o subdomínio do host em /login e mantém links canônicos", async ({ page }) => {
    const captured: CapturedRequests = { contextIdentifiers: [] };
    await installAuthNetworkMocks(page, captured);

    await page.setExtraHTTPHeaders({ "x-forwarded-host": "rede-norte.localhost" });

    await page.goto("/login?next=%2Fdashboard");

    await expect(page.getByRole("heading", { name: "Portal Rede Norte" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Recuperar senha" })).toHaveAttribute(
      "href",
      "/app/rede-norte/forgot-password"
    );
    await expect(captured.contextIdentifiers).toEqual(["rede-norte"]);
  });

  test("usa redeIdentifier na query string de /login para abrir o fluxo por rede", async ({ page }) => {
    const captured: CapturedRequests = { contextIdentifiers: [] };
    await installAuthNetworkMocks(page, captured);

    await page.goto("/login?redeIdentifier=sergioamim");

    await expect(page.getByRole("heading", { name: "Portal Rede Norte" })).toBeVisible();
    await expect(page.getByText("Subdomínio: rede-norte")).toBeVisible();
    await expect(captured.contextIdentifiers).toEqual(["sergioamim"]);
  });

  test("permite envio mesmo sem contexto pré-carregado e valida a rede no submit", async ({ page }) => {
    const captured: CapturedRequests = { contextIdentifiers: [] };
    await installAuthNetworkMocks(page, captured);

    await page.goto("/app/rede-invalida/login");

    await expect(
      page.getByText("Não foi possível carregar o contexto visual da rede agora. Você ainda pode continuar e validar o acesso no envio.")
    ).toBeVisible();
    await expect(page.getByLabel("Identificador")).toBeEnabled();
    await expect(page.getByLabel("Senha")).toBeEnabled();
    await expect(page.getByRole("button", { name: "Entrar" })).toBeEnabled();

    await page.getByLabel("Identificador").fill("admin@academia.local");
    await page.getByLabel("Senha").fill("12345678");
    await page.getByRole("button", { name: "Entrar" }).click();

    expect(captured.contextIdentifiers).toEqual(["rede-invalida"]);
    expect(captured.login).toEqual({
      networkIdentifier: "rede-invalida",
      body: {
        identifier: "admin@academia.local",
        password: "12345678",
        channel: "APP",
      },
    });
  });

  test("redireciona para troca obrigatória de senha quando o login exigir primeiro acesso", async ({ page }) => {
    const captured: CapturedRequests = { contextIdentifiers: [] };
    await installAuthNetworkMocks(page, captured, { forcePasswordChange: true });

    await page.goto("/app/rede-norte/login?next=%2Fdashboard");
    await page.getByLabel("Identificador").fill("ana@qa.local");
    await page.getByLabel("Senha").fill("12345678");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/primeiro-acesso\/trocar-senha(?:\?|$)/);
    await expect(page.getByRole("heading", { name: "Defina sua nova senha" })).toBeVisible();

    await page.getByLabel(/^Nova senha$/).fill("NovaSenha123");
    await page.getByLabel(/^Confirmar nova senha$/).fill("NovaSenha123");
    await page.getByRole("button", { name: "Salvar nova senha" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText("Unidade Centro").first()).toBeVisible();

    const sessionSnapshot = await page.evaluate(() => ({
      forcePasswordChangeRequired: window.localStorage.getItem("academia-auth-force-password-change-required"),
    }));

    expect(sessionSnapshot.forcePasswordChangeRequired).toBe("false");
  });

  test("bloqueia acesso direto à troca obrigatória sem contexto válido", async ({ page }) => {
    const captured: CapturedRequests = { contextIdentifiers: [] };
    await installAuthNetworkMocks(page, captured);

    await page.goto("/primeiro-acesso/trocar-senha");

    await expect(page).toHaveURL(/\/login$/);
  });
});
