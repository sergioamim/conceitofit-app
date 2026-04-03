import { expect, test, type Page, type Route } from "@playwright/test";
import { installBackofficeGlobalSession } from "./support/backoffice-global-session";

type AcademiaSeed = {
  id: string;
  nome: string;
  ativo: boolean;
};

type TenantSeed = {
  id: string;
  academiaId: string;
  groupId: string;
  nome: string;
  ativo: boolean;
};

const ACADEMIAS: AcademiaSeed[] = [
  { id: "academia-rede-principal", nome: "Conceito Fit", ativo: true },
  { id: "academia-mananciais", nome: "Mananciais", ativo: true },
];

const TENANTS: TenantSeed[] = [
  {
    id: "tenant-centro",
    academiaId: "academia-rede-principal",
    groupId: "academia-rede-principal",
    nome: "Unidade Centro",
    ativo: true,
  },
  {
    id: "tenant-norte",
    academiaId: "academia-rede-principal",
    groupId: "academia-rede-principal",
    nome: "Unidade Norte",
    ativo: true,
  },
  {
    id: "tenant-mananciais-s1",
    academiaId: "academia-mananciais",
    groupId: "academia-mananciais",
    nome: "Unidade Mananciais S1",
    ativo: true,
  },
  {
    id: "tenant-mananciais-s2",
    academiaId: "academia-mananciais",
    groupId: "academia-mananciais",
    nome: "Unidade Mananciais S2",
    ativo: true,
  },
];

const DASHBOARD_RESPONSE = {
  totalAlunosAtivos: 54,
  prospectsNovos: 8,
  matriculasDoMes: 5,
  receitaDoMes: 18250,
  prospectsRecentes: [
    {
      id: "prospect-man-1",
      tenantId: "tenant-mananciais-s1",
      nome: "Ana Mananciais",
      telefone: "11999990001",
      origem: "WHATSAPP",
      status: "NOVO",
      dataCriacao: "2026-04-01T10:00:00",
    },
  ],
  matriculasVencendo: [],
  pagamentosPendentes: [],
  statusAlunoCount: {
    ATIVO: 54,
    INATIVO: 4,
    SUSPENSO: 1,
    CANCELADO: 0,
  },
  prospectsEmAberto: 6,
  followupPendente: 2,
  visitasAguardandoRetorno: 1,
  prospectsNovosAnterior: 6,
  matriculasDoMesAnterior: 4,
  receitaDoMesAnterior: 16000,
  ticketMedio: 365,
  ticketMedioAnterior: 342,
  pagamentosRecebidosMes: 17000,
  pagamentosRecebidosMesAnterior: 15000,
  vendasNovas: 8250,
  vendasRecorrentes: 10000,
  inadimplencia: 800,
  aReceber: 2400,
};

function normalizedPath(pathname: string) {
  return pathname.replace(/^\/backend/, "");
}

async function fulfillJson(route: Route, json: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify(json),
  });
}

function resolveAcademia(academiaId: string) {
  return ACADEMIAS.find((academia) => academia.id === academiaId) ?? ACADEMIAS[0];
}

function resolveTenant(tenantId: string) {
  return TENANTS.find((tenant) => tenant.id === tenantId) ?? TENANTS[0];
}

async function installEntrarComoAcademiaFlow(page: Page) {
  let currentTenantId = "tenant-centro";

  await installBackofficeGlobalSession(page, {
    session: {
      activeTenantId: currentTenantId,
      preferredTenantId: currentTenantId,
      baseTenantId: currentTenantId,
      availableTenants: TENANTS.map((tenant, index) => ({
        tenantId: tenant.id,
        defaultTenant: index === 0,
      })),
      userId: "user-super-admin",
      userKind: "COLABORADOR",
      displayName: "Sergio Amim",
      roles: ["SUPER_ADMIN", "ADMIN"],
      availableScopes: ["GLOBAL"],
      broadAccess: true,
      sessionActive: true,
    },
    shell: {
      currentTenantId,
      tenants: TENANTS,
      user: {
        id: "user-super-admin",
        userId: "user-super-admin",
        nome: "Sergio Amim",
        displayName: "Sergio Amim",
        email: "admin@conceito.fit",
        roles: ["SUPER_ADMIN", "ADMIN"],
        userKind: "COLABORADOR",
        activeTenantId: currentTenantId,
        tenantBaseId: currentTenantId,
        availableTenants: TENANTS.map((tenant, index) => ({
          tenantId: tenant.id,
          defaultTenant: index === 0,
        })),
        availableScopes: ["GLOBAL"],
        broadAccess: true,
        redeId: "rede-conceito",
        redeNome: "Conceito Fit",
        redeSlug: "conceito-fit",
      },
      academia: resolveAcademia(resolveTenant(currentTenantId).academiaId),
      capabilities: {
        canAccessElevatedModules: true,
        canDeleteClient: true,
      },
    },
  });

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const path = normalizedPath(url.pathname);

    if (path === "/api/v1/auth/context/tenant" && method === "POST") {
      const payload = request.postDataJSON() as { tenantId?: string };
      const selectedTenant = resolveTenant(payload.tenantId?.trim() || "tenant-mananciais-s1");
      const selectedAcademiaId = selectedTenant.academiaId;
      const filteredTenants = TENANTS.filter((t) => t.academiaId === selectedAcademiaId);
      currentTenantId = selectedTenant.id;
      await fulfillJson(route, {
        token: "token-super-admin-operacional",
        refreshToken: "refresh-super-admin-operacional",
        type: "Bearer",
        userId: "user-super-admin",
        userKind: "COLABORADOR",
        displayName: "Sergio Amim",
        activeTenantId: selectedTenant.id,
        tenantBaseId: selectedTenant.id,
        availableTenants: filteredTenants.map((tenant, index) => ({
          tenantId: tenant.id,
          defaultTenant: index === 0,
        })),
        availableScopes: ["UNIDADE"],
        broadAccess: false,
      });
      return;
    }

    if (path === "/api/v1/auth/me" && method === "GET") {
      const activeTenant = resolveTenant(currentTenantId);
      const filteredTenants = TENANTS.filter((t) => t.academiaId === activeTenant.academiaId);
      await fulfillJson(route, {
        id: "user-super-admin",
        nome: "Sergio Amim",
        email: "admin@conceito.fit",
        roles: ["SUPER_ADMIN", "ADMIN"],
        userKind: "COLABORADOR",
        activeTenantId: currentTenantId,
        availableTenants: filteredTenants.map((tenant, index) => ({
          tenantId: tenant.id,
          defaultTenant: index === 0,
        })),
        capabilities: {
          canAccessElevatedModules: true,
        },
      });
      return;
    }

    if ((path === "/api/v1/context/unidade-ativa" || path === "/api/v1/app/bootstrap") && method === "GET") {
      const activeTenant = resolveTenant(currentTenantId);
      const filteredTenants = TENANTS.filter((t) => t.academiaId === activeTenant.academiaId);
      const academia = resolveAcademia(activeTenant.academiaId);
      await fulfillJson(route, {
        currentTenantId,
        tenantAtual: activeTenant,
        unidadesDisponiveis: filteredTenants,
        user: {
          id: "user-super-admin",
          userId: "user-super-admin",
          nome: "Sergio Amim",
          displayName: "Sergio Amim",
          email: "admin@conceito.fit",
          roles: ["SUPER_ADMIN", "ADMIN"],
          userKind: "COLABORADOR",
          activeTenantId: currentTenantId,
          tenantBaseId: currentTenantId,
          availableTenants: filteredTenants.map((tenant, index) => ({
            tenantId: tenant.id,
            defaultTenant: index === 0,
          })),
          availableScopes: ["UNIDADE"],
          broadAccess: false,
          redeId: academia.id,
          redeNome: academia.nome,
          redeSlug: academia.id,
        },
        academia,
        capabilities: {
          canAccessElevatedModules: true,
          canDeleteClient: true,
        },
      });
      return;
    }

    if (path === "/api/v1/academia/dashboard" && method === "GET") {
      await fulfillJson(route, DASHBOARD_RESPONSE);
      return;
    }

    if (path === "/api/v1/onboarding/status" && method === "GET") {
      await fulfillJson(route, {
        percentualConclusao: 100,
        concluido: true,
        totalEtapas: 0,
        etapasConcluidas: 0,
        etapas: [],
      });
      return;
    }

    if (path === "/api/v1/admin/academias" && method === "GET") {
      await fulfillJson(route, ACADEMIAS);
      return;
    }

    if (path === "/api/v1/admin/unidades" && method === "GET") {
      await fulfillJson(route, TENANTS);
      return;
    }

    if (path === "/api/v1/admin/seguranca/overview" && method === "GET") {
      await fulfillJson(route, {
        totalUsers: 1,
        activeMemberships: TENANTS.length,
        defaultUnitsConfigured: 1,
        eligibleForNewUnits: 1,
      });
      return;
    }

    if (path === "/api/v1/admin/metricas/operacionais/global" && method === "GET") {
      await fulfillJson(route, null);
      return;
    }

    if (path === "/api/v1/auth/refresh" && method === "POST") {
      await fulfillJson(route, {
        token: "token-refreshed",
        refreshToken: "refresh-refreshed",
        type: "Bearer",
      });
      return;
    }

    await route.fallback();
  });

  return {
    getCurrentTenant: () => resolveTenant(currentTenantId),
    setCurrentTenantId(nextTenantId: string) {
      currentTenantId = nextTenantId;
    },
  };
}

test.describe("Backoffice entrar como academia", () => {
  test.setTimeout(120_000);

  test("super user entra como unidade e vê apenas as unidades da academia selecionada", async ({ page }) => {
    await installEntrarComoAcademiaFlow(page);

    await page.goto("/admin/entrar-como-academia");

    await expect(page.getByRole("heading", { name: "Entrar como academia" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("main").getByText("Conceito Fit", { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("main").getByText("Mananciais", { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Selecione uma unidade ao lado.")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "Unidade Mananciais S1" }).click();
    await page.getByRole("button", { name: "Entrar na unidade" }).click();

    await page.waitForURL(/\/dashboard(?:\?|$)/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Unidade Mananciais S1").first()).toBeVisible({ timeout: 15_000 });

    const tenantSelect = page.getByRole("combobox", { name: "Selecionar unidade ativa" });
    await expect(tenantSelect).toBeVisible({ timeout: 15_000 });
    await tenantSelect.click();

    await expect(page.getByRole("option", { name: "Unidade Mananciais S1" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("option", { name: "Unidade Mananciais S2" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("option", { name: "Unidade Centro" })).toHaveCount(0);
    await expect(page.getByRole("option", { name: "Unidade Norte" })).toHaveCount(0);
  });

  test("super user volta ao backoffice após visualizar uma unidade", async ({ page }) => {
    await installEntrarComoAcademiaFlow(page);

    await page.goto("/admin/entrar-como-academia");
    await expect(page.getByRole("heading", { name: "Entrar como academia" })).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "Unidade Mananciais S1" }).click();
    await page.getByRole("button", { name: "Entrar na unidade" }).click();

    await page.waitForURL(/\/dashboard(?:\?|$)/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: "Menu do usuário" }).click();
    await page.getByRole("button", { name: "Voltar ao backoffice" }).click();

    await page.waitForURL(/\/admin(?:\?|$)/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Dashboard do backoffice" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("O backoffice global exige perfil administrativo elevado.")).toHaveCount(0);
  });
});
