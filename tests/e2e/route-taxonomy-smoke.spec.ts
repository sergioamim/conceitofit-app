import { expect, test } from "@playwright/test";
import { installE2EAuthSession } from "./support/auth-session";
import { openAdminCrudPage } from "./support/admin-crud-helpers";
import { fulfillJson, installProtectedShellMocks } from "./support/protected-shell-mocks";
import {
  resolveStorefrontBackendMockPort,
  startStorefrontBackendMock,
  stopStorefrontBackendMock,
  type StorefrontMockHandle,
} from "./support/storefront-backend-mock";

test.describe.configure({ mode: "serial" });

let storefrontBackend: StorefrontMockHandle;
const STOREFRONT_BACKEND_PORT = resolveStorefrontBackendMockPort();
const PLAYWRIGHT_BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const PLAYWRIGHT_BASE_ORIGIN = new URL(PLAYWRIGHT_BASE_URL);

test.beforeAll(async () => {
  storefrontBackend = await startStorefrontBackendMock(STOREFRONT_BACKEND_PORT);
});

test.afterAll(async () => {
  await stopStorefrontBackendMock(storefrontBackend);
});

/**
 * Quando o mock teve que cair em porta alternativa (8080 ocupado por Java
 * real), injetamos a URL override no cookie `academia-e2e-backend-base-url`
 * pra que `serverFetch` e `proxy.ts` desviem do host padrão.
 *
 * O cookie precisa estar disponível tanto em `localhost` (rotas canônicas)
 * quanto em `*.localhost` (subdomínios storefront). Cookies com
 * `domain: .localhost` não são aceitos — portanto setamos múltiplas
 * entradas explícitas cobrindo os hosts usados por este spec.
 */
async function seedMockBackendOverride(context: {
  addCookies: (
    cookies: Array<{ name: string; value: string; url: string }>,
  ) => Promise<void>;
}) {
  if (!storefrontBackend?.usedFallbackPort) return;
  const value = encodeURIComponent(storefrontBackend.baseUrl);
  const port = PLAYWRIGHT_BASE_ORIGIN.port || "3400";
  const origins = [
    PLAYWRIGHT_BASE_URL,
    `http://academia-demo.localhost:${port}`,
    `http://nao-existe.localhost:${port}`,
  ];
  await context.addCookies(
    origins.map((url) => ({
      name: "academia-e2e-backend-base-url",
      value,
      url,
    })),
  );
}

test("mantém as superfícies públicas e de login canônicas", async ({ page, context }) => {
  await seedMockBackendOverride(context);
  // Landing institucional — `/b2b` é o destino canônico do redirect de `/`.
  // Os error boundaries em `src/app/error.tsx` e `src/app/(portal)/error.tsx`
  // tratam `NEXT_REDIRECT` retornando `null` para não poluir o DOM; em test
  // env o dev overlay do Next ainda pode materializar a exception quando a
  // rota `/` dispara um redirect server-side, então o teste vai direto em
  // `/b2b` (mesmo destino, sem goto intermediário).
  await page.goto("/b2b", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /próximo nível/i })).toBeVisible();

  // TODO: `/adesao?tenant=...` depende do server component `AdesaoLandingServer`
  // consumir mocks via `serverFetch` no host correto. Em test env atual o
  // backend mock do storefront não cobre `/api/v1/unidades`, causando 404 e
  // fallback para notFound. Issue separada do Perfil v3.

  await page.goto("/login", { waitUntil: "domcontentloaded" });
  // Heading canônico do /login é "Conceito Fit" (marca institucional) com
  // subtítulo "Acesso administrativo da plataforma".
  await expect(page.getByRole("heading", { name: "Conceito Fit" })).toBeVisible();
  await expect(page.getByText("Acesso administrativo da plataforma")).toBeVisible();

  await page.route("**/api/v1/auth/rede-contexto", async (route) => {
    await fulfillJson(route, {
      id: "rede-norte",
      subdomain: "rede-norte",
      slug: "rede-norte",
      nome: "Rede Norte",
      appName: "Rede Norte Acesso",
      supportText: "Acesse no contexto correto da rede.",
      accentLabel: "Acesso por rede",
    });
  });

  await page.goto("/login?redeIdentifier=rede-norte", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Acesso por rede")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Rede Norte Acesso" })).toBeVisible();
  await expect(page.getByText("Rede Norte", { exact: true })).toBeVisible();
});

test("preserva portal operacional e backoffice global", async ({ page }) => {
  await installProtectedShellMocks(page, {
    currentTenantId: "tenant-centro",
    tenants: [
      {
        id: "tenant-centro",
        nome: "Unidade Centro",
        ativo: true,
        academiaId: "academia-demo",
        groupId: "academia-demo",
      },
    ],
    user: {
      userId: "user-route-taxonomy",
      nome: "Usuário Taxonomia",
      displayName: "Usuário Taxonomia",
      email: "route-taxonomy@academia.local",
      roles: ["ADMIN"],
      userKind: "COLABORADOR",
      activeTenantId: "tenant-centro",
      tenantBaseId: "tenant-centro",
      availableScopes: ["UNIDADE"],
      broadAccess: false,
    },
    academia: {
      id: "academia-demo",
      nome: "Academia Demo",
      ativo: true,
    },
  });

  await page.route("**/api/v1/academia/dashboard**", async (route) => {
    await fulfillJson(route, {
      totalAlunosAtivos: 42,
      prospectsNovos: 8,
      prospectsNovosAnterior: 7,
      matriculasDoMes: 5,
      matriculasDoMesAnterior: 4,
      receitaDoMes: 12500,
      receitaDoMesAnterior: 11800,
      visitasAguardandoRetorno: 2,
      followupPendente: 1,
      prospectsRecentes: [],
      matriculasVencendo: [],
      pagamentosPendentes: [],
      statusAlunoCount: { ATIVO: 42, INATIVO: 1, SUSPENSO: 0, CANCELADO: 0 },
    });
  });

  await installE2EAuthSession(page, {
    token: "token-route-taxonomy",
    refreshToken: "refresh-route-taxonomy",
    type: "Bearer",
    userId: "user-route-taxonomy",
    userKind: "COLABORADOR",
    displayName: "Usuário Taxonomia",
    activeTenantId: "tenant-centro",
    baseTenantId: "tenant-centro",
    preferredTenantId: "tenant-centro",
    availableTenants: [{ tenantId: "tenant-centro", defaultTenant: true }],
    availableScopes: ["UNIDADE"],
    broadAccess: false,
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  await openAdminCrudPage(page, "/admin");
  await expect(page.getByRole("heading", { name: "Dashboard do backoffice" })).toBeVisible();
});

test("mantém storefront por slug, rewrite por subdomínio e not-found público", async ({ page, context }) => {
  await seedMockBackendOverride(context);
  await page.goto("/storefront/academia-demo", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Academia Demo" })).toBeVisible();
  await expect(page.getByText("Seu treino começa aqui.")).toBeVisible();
  await expect(page.getByText("Plano Demo Premium")).toBeVisible();
  await expect(page.getByRole("link", { name: "Assinar agora" })).toHaveAttribute(
    "href",
    /\/adesao\/cadastro\?tenant=tenant-demo&plan=plano-demo-premium/,
  );

  await page.goto(`http://academia-demo.localhost:${PLAYWRIGHT_BASE_ORIGIN.port}/`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Academia Demo" })).toBeVisible();
  await expect(page.getByText("Seu treino começa aqui.")).toBeVisible();
  await expect(page.getByText("Plano Demo Premium")).toBeVisible();
  await expect(page.getByRole("link", { name: "Assinar agora" })).toHaveAttribute(
    "href",
    /\/adesao\/cadastro\?tenant=tenant-demo&plan=plano-demo-premium/,
  );

  await page.goto(`http://nao-existe.localhost:${PLAYWRIGHT_BASE_ORIGIN.port}/qualquer`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Storefront não encontrada" })).toBeVisible();
});
