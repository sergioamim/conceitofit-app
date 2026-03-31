import { expect, test, type Page, type Route } from "@playwright/test";
import { seedAuthenticatedSession } from "./support/backend-only-stubs";

const TENANT_MANANCIAIS = {
  id: "tenant-mananciais-s1",
  academiaId: "academia-sergio-amim",
  groupId: "academia-sergio-amim",
  nome: "MANANCIAIS - S1",
  ativo: true,
};

const TENANT_PECHINCHA = {
  id: "tenant-pechincha-s3",
  academiaId: "academia-sergio-amim",
  groupId: "academia-sergio-amim",
  nome: "PECHINCHA - S3",
  ativo: true,
};

const ACADEMIA = {
  id: "academia-sergio-amim",
  nome: "Academia Sergio Amim",
  ativo: true,
};

async function fulfillJson(route: Route, json: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify(json),
  });
}

function normalizePath(pathname: string) {
  return pathname.replace(/^\/backend/, "");
}

async function installBiApiMocks(page: Page) {
  let currentTenantId = TENANT_MANANCIAIS.id;

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const path = normalizePath(url.pathname);

    // Auth/session endpoints
    if (path === "/api/v1/auth/me" && method === "GET") {
      await fulfillJson(route, {
        id: "user-admin",
        userId: "user-admin",
        nome: "Admin BI",
        displayName: "Admin BI",
        email: "admin@academia.local",
        roles: ["OWNER", "ADMIN"],
        userKind: "COLABORADOR",
        redeId: ACADEMIA.id,
        redeNome: ACADEMIA.nome,
        redeSlug: "academia-sergio-amim",
        activeTenantId: currentTenantId,
        availableTenants: [
          { tenantId: TENANT_MANANCIAIS.id, defaultTenant: true },
          { tenantId: TENANT_PECHINCHA.id, defaultTenant: false },
        ],
      });
      return;
    }

    if (path === "/api/v1/app/bootstrap" && method === "GET") {
      await fulfillJson(route, {
        user: {
          id: "user-admin",
          userId: "user-admin",
          nome: "Admin BI",
          displayName: "Admin BI",
          email: "admin@academia.local",
          roles: ["OWNER", "ADMIN"],
          userKind: "COLABORADOR",
          redeId: ACADEMIA.id,
          redeNome: ACADEMIA.nome,
          redeSlug: "academia-sergio-amim",
          activeTenantId: currentTenantId,
          availableTenants: [
            { tenantId: TENANT_MANANCIAIS.id, defaultTenant: true },
            { tenantId: TENANT_PECHINCHA.id, defaultTenant: false },
          ],
          availableScopes: ["UNIDADE"],
          broadAccess: false,
        },
        tenantContext: {
          currentTenantId,
          tenantAtual: TENANT_MANANCIAIS,
          unidadesDisponiveis: [TENANT_MANANCIAIS, TENANT_PECHINCHA],
        },
        academia: ACADEMIA,
        capabilities: { canAccessElevatedModules: true, canDeleteClient: false },
      });
      return;
    }

    if (path === "/api/v1/context/unidade-ativa" && method === "GET") {
      await fulfillJson(route, {
        currentTenantId,
        tenantAtual: currentTenantId === TENANT_PECHINCHA.id ? TENANT_PECHINCHA : TENANT_MANANCIAIS,
        unidadesDisponiveis: [TENANT_MANANCIAIS, TENANT_PECHINCHA],
      });
      return;
    }

    if (/^\/api\/v1\/context\/unidade-ativa\/[^/]+$/.test(path) && method === "PUT") {
      currentTenantId = path.split("/").at(-1) ?? currentTenantId;
      const tenant = currentTenantId === TENANT_PECHINCHA.id ? TENANT_PECHINCHA : TENANT_MANANCIAIS;
      await fulfillJson(route, {
        currentTenantId,
        tenantAtual: tenant,
        unidadesDisponiveis: [TENANT_MANANCIAIS, TENANT_PECHINCHA],
      });
      return;
    }

    if (path === "/api/v1/academia" && method === "GET") {
      await fulfillJson(route, ACADEMIA);
      return;
    }

    if (path === "/api/v1/unidades" && method === "GET") {
      await fulfillJson(route, [TENANT_MANANCIAIS, TENANT_PECHINCHA]);
      return;
    }

    // Prospects
    if (path === "/api/v1/crm/prospects" && method === "GET") {
      await fulfillJson(route, {
        items: [
          {
            id: "prospect-1",
            tenantId: currentTenantId,
            nome: "João Silva",
            telefone: "(21) 99999-0001",
            email: "joao@test.local",
            origem: "WHATSAPP",
            status: "NOVO",
            dataCriacao: "2026-03-01T10:00:00",
          },
        ],
        page: 0,
        size: 20,
        hasNext: false,
      });
      return;
    }

    // Alunos
    if (path === "/api/v1/comercial/alunos" && method === "GET") {
      await fulfillJson(route, {
        items: [
          {
            id: "aluno-1",
            tenantId: currentTenantId,
            nome: "Maria Santos",
            email: "maria@test.local",
            telefone: "(21) 99999-0002",
            cpf: "11111111111",
            dataNascimento: "1995-01-01",
            sexo: "F",
            status: "ATIVO",
            dataCadastro: "2026-01-15",
          },
        ],
        page: 0,
        size: 1000,
        hasNext: false,
        totaisStatus: { total: 1, ativos: 1, suspensos: 0, inativos: 0, cancelados: 0 },
      });
      return;
    }

    // Matriculas
    if ((path === "/api/v1/comercial/adesoes" || path === "/api/v1/comercial/matriculas") && method === "GET") {
      await fulfillJson(route, [
        {
          id: "mat-1",
          tenantId: currentTenantId,
          alunoId: "aluno-1",
          planoId: "plano-1",
          dataInicio: "2026-01-15",
          dataFim: "2026-12-31",
          valorPago: 189.9,
          valorMatricula: 59.9,
          desconto: 0,
          formaPagamento: "PIX",
          status: "ATIVA",
          renovacaoAutomatica: true,
          dataCriacao: "2026-01-15",
        },
      ]);
      return;
    }

    // Contas a receber / pagamentos
    if (
      (path === "/api/v1/gerencial/financeiro/contas-receber" ||
        path === "/api/v1/comercial/pagamentos") &&
      method === "GET"
    ) {
      await fulfillJson(route, []);
      return;
    }

    // Atividade grades
    if (path === "/api/v1/administrativo/atividades-grade" && method === "GET") {
      await fulfillJson(route, []);
      return;
    }

    // Reservas aula
    if (path === "/api/v1/agenda/aulas/reservas" && method === "GET") {
      await fulfillJson(route, []);
      return;
    }

    // Auth refresh
    if (path === "/api/v1/auth/refresh" && method === "POST") {
      await fulfillJson(route, { token: "token-e2e", refreshToken: "refresh-e2e", type: "Bearer" });
      return;
    }

    // Catch-all: return empty for any unhandled GET
    if (method === "GET") {
      await fulfillJson(route, []);
      return;
    }

    await route.continue();
  });
}

test.describe("BI operacional e visão de rede", () => {
  test("navega entre visão unitária e rede com filtros gerenciais", async ({ page }) => {
    await seedAuthenticatedSession(page, {
      tenantId: TENANT_MANANCIAIS.id,
      availableTenants: [
        { tenantId: TENANT_MANANCIAIS.id, defaultTenant: true },
        { tenantId: TENANT_PECHINCHA.id },
      ],
    });
    await installBiApiMocks(page);

    await page.goto("/gerencial/bi");
    await expect(page.getByRole("heading", { name: "BI Operacional" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Exportar CSV" })).toBeVisible();
    await expect(page.getByText("Benchmark por unidade")).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "MANANCIAIS - S1" })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "PECHINCHA - S3" })).toBeVisible();

    await page.getByLabel("Escopo BI").click();
    await page.getByRole("option", { name: "Academia / rede" }).click();
    await expect(page.getByLabel("Academia BI")).toContainText("Academia Sergio Amim");

    await page.getByRole("link", { name: "Abrir visão de rede" }).click();
    await expect(page.getByRole("heading", { name: "Visão de Rede" })).toBeVisible();
    await expect(page.getByText("Rede consolidada")).toBeVisible();
    await expect(page.getByText("Ranking da rede")).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "MANANCIAIS - S1" })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "PECHINCHA - S3" })).toBeVisible();

    await page.getByLabel("Unidade Rede").click();
    await page.getByRole("option", { name: "PECHINCHA - S3" }).click();
    await expect(page.getByLabel("Unidade Rede")).toContainText("PECHINCHA - S3");
    await expect(page.getByText("Unidade filtrada")).toBeVisible();

    await page.getByLabel("Segmento Rede").click();
    await page.getByRole("option", { name: "WhatsApp" }).click();
    await expect(page.getByText("Checklist de governança")).toBeVisible();
  });
});
