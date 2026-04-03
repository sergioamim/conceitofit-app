import type { Server } from "node:http";
import { expect, test } from "@playwright/test";
import { installE2EAuthSession } from "./support/auth-session";
import { openAdminCrudPage } from "./support/admin-crud-helpers";
import { fulfillJson, installProtectedShellMocks } from "./support/protected-shell-mocks";
import {
  resolveStorefrontBackendMockPort,
  startStorefrontBackendMock,
  stopStorefrontBackendMock,
} from "./support/storefront-backend-mock";

test.describe.configure({ mode: "serial" });

let storefrontBackend: Server;
const STOREFRONT_BACKEND_PORT = resolveStorefrontBackendMockPort();
const PLAYWRIGHT_BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const PLAYWRIGHT_BASE_ORIGIN = new URL(PLAYWRIGHT_BASE_URL);

test.beforeAll(async () => {
  storefrontBackend = await startStorefrontBackendMock(STOREFRONT_BACKEND_PORT);
});

test.afterAll(async () => {
  await stopStorefrontBackendMock(storefrontBackend);
});

test("mantém as superfícies públicas e de login canônicas", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Gestao, operacao e jornada digital em um unico lugar" }),
  ).toBeVisible();

  await page.goto("/b2b", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Uma plataforma, zero gambiarras. Do financeiro ao treino.")).toBeVisible();

  await page.goto("/adesao?tenant=pechincha-s3", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Carregando jornada pública...")).not.toBeVisible({ timeout: 30_000 });
  await expect(
    page.getByRole("heading", { name: "Um funil enxuto para trial, cadastro, checkout e assinatura." }),
  ).toBeVisible();

  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Acesso" })).toBeVisible();

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

test("mantém storefront por slug, rewrite por subdomínio e not-found público", async ({ page }) => {
  await page.goto("/storefront/academia-demo", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Academia Demo" })).toBeVisible();
  await expect(page.getByText("Seu treino começa aqui.")).toBeVisible();

  await page.goto(`http://academia-demo.localhost:${PLAYWRIGHT_BASE_ORIGIN.port}/`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Academia Demo" })).toBeVisible();
  await expect(page.getByText("Seu treino começa aqui.")).toBeVisible();

  await page.goto(`http://nao-existe.localhost:${PLAYWRIGHT_BASE_ORIGIN.port}/qualquer`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Storefront não encontrada" })).toBeVisible();
});
