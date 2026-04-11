import type { Page } from "@playwright/test";
import { installE2EAuthSession } from "./auth-session";

/**
 * Helper de sessão para jornadas do portal gerencial `(portal)/*`.
 *
 * Equivalente ao `seedAlunoSession` mas com userKind=OPERADOR e perfis
 * elevados. O layout RSC de `(portal)` valida cookies `fc_session_active`
 * e `fc_access_token` antes de liberar a navegação, e o hook
 * `useTenantContext` depende de `fc_session_claims` para resolver o
 * userId/displayName.
 */

const E2E_BASE_URL = "http://localhost:3000";
const SESSION_ACTIVE_COOKIE = "fc_session_active";
const ACCESS_TOKEN_COOKIE = "fc_access_token";
const SESSION_CLAIMS_COOKIE = "fc_session_claims";

function resolveE2EBaseUrl() {
  const configured = process.env.PLAYWRIGHT_BASE_URL?.trim();
  return configured && /^https?:\/\//.test(configured) ? configured : E2E_BASE_URL;
}

export type GerencialSessionOptions = {
  tenantId: string;
  userId?: string;
  displayName?: string;
  networkSlug?: string;
  networkName?: string;
  userKind?: "OPERADOR" | "ADMIN" | "OWNER";
  roles?: string[];
  availableScopes?: ("UNIDADE" | "REDE" | "GLOBAL")[];
  broadAccess?: boolean;
};

export async function seedGerencialSession(
  page: Page,
  options: GerencialSessionOptions,
): Promise<void> {
  const baseUrl = resolveE2EBaseUrl();
  const userId = options.userId ?? "operador-e2e";
  const roles = options.roles ?? ["OPERADOR", "ADMIN"];
  const availableScopes = options.availableScopes ?? ["UNIDADE", "REDE"];

  const claims = {
    userId,
    userKind: options.userKind ?? "OPERADOR",
    displayName: options.displayName ?? "Operador E2E",
    activeTenantId: options.tenantId,
    baseTenantId: options.tenantId,
    networkSubdomain: options.networkSlug ?? "academia-e2e",
    networkSlug: options.networkSlug ?? "academia-e2e",
    networkName: options.networkName ?? "Academia E2E",
    availableScopes,
    broadAccess: options.broadAccess ?? false,
    forcePasswordChangeRequired: false,
  };

  await page.context().addCookies([
    { name: SESSION_ACTIVE_COOKIE, value: "true", url: baseUrl },
    { name: ACCESS_TOKEN_COOKIE, value: "token-gerencial-e2e", url: baseUrl },
    {
      name: SESSION_CLAIMS_COOKIE,
      value: encodeURIComponent(JSON.stringify(claims)),
      url: baseUrl,
    },
  ]);

  await installE2EAuthSession(page, {
    activeTenantId: options.tenantId,
    preferredTenantId: options.tenantId,
    baseTenantId: options.tenantId,
    availableTenants: [{ tenantId: options.tenantId, defaultTenant: true }],
    userId,
    userKind: options.userKind ?? "OPERADOR",
    displayName: options.displayName ?? "Operador E2E",
    networkSlug: options.networkSlug ?? "academia-e2e",
    networkSubdomain: options.networkSlug ?? "academia-e2e",
    networkName: options.networkName ?? "Academia E2E",
    roles,
    availableScopes,
    broadAccess: options.broadAccess ?? false,
  });
}

/**
 * Mocks compartilhados mínimos para qualquer tela do portal gerencial.
 * Resolve auth/me, contexto de unidade ativa, academia base. Cada spec
 * adiciona depois suas rotas específicas do módulo.
 */
export async function installGerencialCommonMocks(
  page: Page,
  options: { tenantId: string; userId?: string; displayName?: string } = {
    tenantId: "tenant-gerencial-e2e",
  },
): Promise<void> {
  const userId = options.userId ?? "operador-e2e";
  const displayName = options.displayName ?? "Operador E2E";

  await page.route("**/api/v1/auth/me", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: userId,
        nome: displayName,
        email: "operador@academia.local",
        roles: ["OPERADOR", "ADMIN"],
        activeTenantId: options.tenantId,
        availableTenants: [{ tenantId: options.tenantId, defaultTenant: true }],
      }),
    });
  });

  await page.route("**/api/v1/context/unidade-ativa", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        currentTenantId: options.tenantId,
        tenantAtual: {
          id: options.tenantId,
          nome: "Academia E2E",
          ativo: true,
          groupId: options.tenantId,
          subdomain: "academia-e2e",
        },
        unidadesDisponiveis: [
          {
            id: options.tenantId,
            nome: "Academia E2E",
            ativo: true,
            groupId: options.tenantId,
          },
        ],
      }),
    });
  });

  await page.route("**/api/v1/academia**", async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    // Intercepta /academia e subrotas simples — specs podem sobrescrever
    const url = new URL(route.request().url());
    if (url.pathname.includes("/notificacoes")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "[]",
      });
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: options.tenantId,
        nome: "Academia E2E",
        razaoSocial: "Academia E2E Ltda",
        documento: "12.345.678/0001-90",
      }),
    });
  });

  // Auth refresh — silencia os loops (retorna sessão atual)
  await page.route("**/api/v1/auth/refresh", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        token: "token-gerencial-e2e",
        refreshToken: "refresh-gerencial-e2e",
        type: "Bearer",
        expiresIn: 3600,
      }),
    });
  });
}
