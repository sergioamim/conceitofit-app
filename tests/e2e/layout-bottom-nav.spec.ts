import { test, expect, type Page, type Route } from "@playwright/test";
import { seedAuthenticatedSession } from "./support/backend-only-stubs";
import { installOperationalAppShellMocks } from "./support/protected-shell-mocks";

const TENANT = {
  id: "tenant-mobile",
  nome: "Unidade Mobile",
  academiaId: "academia-mobile",
  groupId: "academia-mobile",
  ativo: true,
};

async function fulfillJson(route: Route, json: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify(json),
  });
}

async function installBottomNavShell(page: Page) {
  await installOperationalAppShellMocks(page, {
    currentTenantId: TENANT.id,
    tenants: [TENANT],
    user: {
      id: "user-mobile",
      userId: "user-mobile",
      nome: "Operador Mobile",
      displayName: "Operador Mobile",
      email: "mobile@academia.local",
      roles: ["ADMIN"],
      userKind: "COLABORADOR",
      activeTenantId: TENANT.id,
      tenantBaseId: TENANT.id,
      availableTenants: [{ tenantId: TENANT.id, defaultTenant: true }],
      availableScopes: ["UNIDADE"],
      broadAccess: false,
      redeId: TENANT.academiaId,
      redeNome: "Academia Mobile",
      redeSlug: "academia-mobile",
    },
    academia: {
      id: TENANT.academiaId,
      nome: "Academia Mobile",
      ativo: true,
    },
    routes: {
      authRefresh: true,
      onboardingStatus: true,
    },
  });

  await page.route("**/api/v1/comercial/alunos**", async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }

    await fulfillJson(route, {
      items: [],
      page: 0,
      size: 20,
      total: 0,
      hasNext: false,
      totaisStatus: {
        total: 0,
        totalAtivo: 0,
        totalSuspenso: 0,
        totalInativo: 0,
        totalCancelado: 0,
      },
    });
  });

  await page.route("**/api/v1/gerencial/catraca-acessos**", async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }

    await fulfillJson(route, {
      lista: {
        items: [],
        page: 0,
        size: 20,
        total: 0,
        hasNext: false,
      },
      resumo: {
        entradas: 0,
        entradasManuais: 0,
        bloqueados: 0,
        frequenciaMediaPorCliente: 0,
      },
      serieDiaria: [],
      rankingFrequencia: [],
    });
  });

  await seedAuthenticatedSession(page, {
    tenantId: TENANT.id,
    tenantName: TENANT.nome,
    availableTenants: [{ tenantId: TENANT.id, defaultTenant: true }],
  });
}

test.describe("Bottom Navigation Mobile", () => {
  // Configura a viewport para testar comportamento mobile
  test.use({ viewport: { width: 375, height: 812 } });

  test("deve exibir a BottomNav em mobile e ocultar em desktop", async ({ page }) => {
    await installBottomNavShell(page);
    // Acessa uma página não requerendo onboarding profundo
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page).not.toHaveURL(/\/login/);

    // BottomNav localizador
    const bottomNav = page.locator("nav.fixed.bottom-0");
    
    // Verifica visibilidade em mobile
    await expect(bottomNav).toBeVisible();
    await expect(bottomNav.getByRole("link", { name: "Dashboard" })).toBeVisible();

    // Muda viewport para Desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Devido ao md:hidden, deverá ficar invisível
    await expect(bottomNav).toBeHidden();
  });

  test("deve navegar pelos atalhos críticos da BottomNav", async ({ page }) => {
    await installBottomNavShell(page);
    // Volta para Mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page).not.toHaveURL(/\/login/);

    const bottomNav = page.locator("nav.fixed.bottom-0");

    // "Dashboard" deve estar com atributo ativo (aria-current="page" ou estilizado)
    const dashboardLink = bottomNav.getByRole("link", { name: "Dashboard" });
    await expect(dashboardLink).toHaveAttribute("aria-current", "page");

    // Clica em "Clientes"
    const clientesLink = bottomNav.getByRole("link", { name: "Clientes" });
    await expect(clientesLink).toBeVisible();
    await clientesLink.click();

    // Esperar navegação
    await page.waitForURL(/\/clientes/, { timeout: 15_000 });
    await expect(page).not.toHaveURL(/\/login/);

    // "Clientes" deve estar ativo
    await expect(bottomNav.getByRole("link", { name: "Clientes" })).toHaveAttribute("aria-current", "page");
    // "Dashboard" não deve estar ativo mais
    await expect(bottomNav.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute("aria-current", "page");

    // Clica em "Check-in" (Gerencial/Catraca Acessos)
    const checkinLink = bottomNav.getByRole("link", { name: "Check-in" });
    await expect(checkinLink).toBeVisible();
    await checkinLink.click();
    await page.waitForURL(/\/gerencial\/catraca-acessos/, { timeout: 15_000 });
    await expect(page).not.toHaveURL(/\/login/);
    await expect(bottomNav.getByRole("link", { name: "Check-in" })).toHaveAttribute("aria-current", "page");
  });
});
