import type { Page } from "@playwright/test";
import { installE2EAuthSession } from "./auth-session";

/**
 * Session seed para jornadas do portal do aluno `(cliente)/*`.
 *
 * Diferente do gerencial, o layout RSC do `(cliente)` valida presença dos
 * cookies `fc_session_active=true` E `fc_access_token` antes de liberar as
 * rotas protegidas (ver src/app/(cliente)/layout.tsx). Este helper garante
 * que ambos os cookies são setados junto com a seed padrão de localStorage.
 */

const E2E_BASE_URL = "http://localhost:3000";
const SESSION_ACTIVE_COOKIE = "fc_session_active";
const ACCESS_TOKEN_COOKIE = "fc_access_token";
const SESSION_CLAIMS_COOKIE = "fc_session_claims";

function resolveE2EBaseUrl() {
  const configured = process.env.PLAYWRIGHT_BASE_URL?.trim();
  return configured && /^https?:\/\//.test(configured) ? configured : E2E_BASE_URL;
}

export type AlunoSessionOptions = {
  tenantId: string;
  userId: string;
  displayName?: string;
  networkSlug?: string;
  networkName?: string;
};

/**
 * Semeia uma sessão autenticada de aluno (userKind "ALUNO") apta a
 * navegar pelas rotas `(cliente)/*`. Cobre: cookies HttpOnly-like,
 * localStorage via installE2EAuthSession, e o token JWT mockado com
 * user_kind correto.
 */
export async function seedAlunoSession(
  page: Page,
  options: AlunoSessionOptions,
): Promise<void> {
  const baseUrl = resolveE2EBaseUrl();

  // Claims que o token-store lê via cookie `fc_session_claims`.
  // O `useTenantContext` depende deste cookie para resolver userId/userKind.
  const claims = {
    userId: options.userId,
    userKind: "ALUNO",
    displayName: options.displayName ?? "Aluno E2E",
    activeTenantId: options.tenantId,
    baseTenantId: options.tenantId,
    networkId: undefined as string | undefined,
    networkSubdomain: options.networkSlug ?? "academia-e2e",
    networkSlug: options.networkSlug ?? "academia-e2e",
    networkName: options.networkName ?? "Academia E2E",
    availableScopes: ["UNIDADE"],
    broadAccess: false,
    forcePasswordChangeRequired: false,
  };

  // Cookies que o layout RSC de `(cliente)` + o token-store inspecionam
  await page.context().addCookies([
    {
      name: SESSION_ACTIVE_COOKIE,
      value: "true",
      url: baseUrl,
    },
    {
      name: ACCESS_TOKEN_COOKIE,
      value: "token-aluno-e2e",
      url: baseUrl,
    },
    {
      name: SESSION_CLAIMS_COOKIE,
      value: encodeURIComponent(JSON.stringify(claims)),
      url: baseUrl,
    },
  ]);

  // Seed de localStorage + demais cookies (active-tenant, etc)
  await installE2EAuthSession(page, {
    activeTenantId: options.tenantId,
    preferredTenantId: options.tenantId,
    baseTenantId: options.tenantId,
    availableTenants: [{ tenantId: options.tenantId, defaultTenant: true }],
    userId: options.userId,
    userKind: "ALUNO",
    displayName: options.displayName ?? "Aluno E2E",
    networkSlug: options.networkSlug ?? "academia-e2e",
    networkSubdomain: options.networkSlug ?? "academia-e2e",
    networkName: options.networkName ?? "Academia E2E",
    roles: ["ALUNO"],
  });
}
