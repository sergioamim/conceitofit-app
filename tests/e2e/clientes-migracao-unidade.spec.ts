import { expect, test, type Page, type Request, type Route } from "@playwright/test";
import { seedAuthenticatedSession } from "./support/backend-only-stubs";

const TENANT_ORIGEM = {
  id: "tenant-migracao-origem",
  nome: "Unidade Origem",
  academiaId: "academia-migracao",
  groupId: "academia-migracao",
  ativo: true,
  branding: {
    appName: "Conceito Fit Comercial",
  },
};

const TENANT_DESTINO = {
  id: "tenant-migracao-destino",
  nome: "Unidade Destino",
  academiaId: "academia-migracao",
  groupId: "academia-migracao",
  ativo: true,
  branding: {
    appName: "Conceito Fit Comercial",
  },
};

const ALUNO = {
  id: "aluno-migracao-1",
  tenantId: TENANT_ORIGEM.id,
  nome: "Julia Migração",
  email: "julia.migracao@academia.local",
  telefone: "(11) 99999-3000",
  cpf: "11122233399",
  dataNascimento: "1993-07-10",
  sexo: "F",
  status: "ATIVO",
  pendenteComplementacao: false,
  dataCadastro: "2026-03-01T10:00:00",
};

type MigrationResponse =
  | {
      status: 200;
      body: {
        success: true;
        auditId: string;
        message?: string;
        tenantOrigemId: string;
        tenantOrigemNome: string;
        tenantDestinoId: string;
        tenantDestinoNome: string;
        suggestedActiveTenantId?: string;
      };
    }
  | {
      status: 409 | 422;
      body: {
        message: string;
        blockedBy?: Array<{ code: string; message: string }>;
      };
    };

async function fulfillJson(route: Route, json: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify(json),
  });
}

function parseBody<T = unknown>(request: Request): T {
  try {
    return JSON.parse(request.postData() ?? "{}") as T;
  } catch {
    return {} as T;
  }
}

async function installClienteMigrationMocks(
  page: Page,
  input?: {
    migrationResponses?: MigrationResponse[];
  },
) {
  const migrationResponses = [...(input?.migrationResponses ?? [])];
  let currentTenantId = TENANT_ORIGEM.id;
  let baseTenantId = TENANT_ORIGEM.id;

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/backend/, "");
    const method = request.method();

    if (path === "/api/v1/app/bootstrap" && method === "GET") {
      await fulfillJson(route, {
        user: {
          id: "user-1",
          nome: "Gestor Comercial",
          email: "gestor@academia.local",
          roles: ["ALTO"],
          userKind: "COLABORADOR",
          activeTenantId: currentTenantId,
          availableTenants: [
            { tenantId: TENANT_ORIGEM.id, defaultTenant: true },
            { tenantId: TENANT_DESTINO.id, defaultTenant: false },
          ],
        },
        tenantContext: {
          currentTenantId,
          tenantAtual: currentTenantId === TENANT_DESTINO.id ? TENANT_DESTINO : TENANT_ORIGEM,
          unidadesDisponiveis: [TENANT_ORIGEM, TENANT_DESTINO],
        },
        academia: {
          id: TENANT_ORIGEM.academiaId,
          nome: "Academia Comercial",
          ativo: true,
          branding: TENANT_ORIGEM.branding,
        },
        capabilities: {
          canAccessElevatedModules: true,
          canDeleteClient: true,
        },
      });
      return;
    }

    if (path === "/api/v1/auth/me" && method === "GET") {
      await fulfillJson(route, {
        id: "user-1",
        nome: "Gestor Comercial",
        email: "gestor@academia.local",
        roles: ["ALTO"],
        userKind: "COLABORADOR",
        activeTenantId: currentTenantId,
        availableTenants: [
          { tenantId: TENANT_ORIGEM.id, defaultTenant: true },
          { tenantId: TENANT_DESTINO.id, defaultTenant: false },
        ],
      });
      return;
    }

    if (path === "/api/v1/context/unidade-ativa" && method === "GET") {
      await fulfillJson(route, {
        currentTenantId,
        tenantAtual: currentTenantId === TENANT_DESTINO.id ? TENANT_DESTINO : TENANT_ORIGEM,
        unidadesDisponiveis: [TENANT_ORIGEM, TENANT_DESTINO],
      });
      return;
    }

    const contextMatch = path.match(/^\/api\/v1\/context\/unidade-ativa\/([^/]+)$/);
    if (contextMatch && method === "PUT") {
      currentTenantId = decodeURIComponent(contextMatch[1] ?? "").trim() || currentTenantId;
      await fulfillJson(route, {
        currentTenantId,
        tenantAtual: currentTenantId === TENANT_DESTINO.id ? TENANT_DESTINO : TENANT_ORIGEM,
        unidadesDisponiveis: [TENANT_ORIGEM, TENANT_DESTINO],
      });
      return;
    }

    if (path === "/api/v1/academia" && method === "GET") {
      await fulfillJson(route, {
        id: TENANT_ORIGEM.academiaId,
        nome: "Academia Comercial",
        ativo: true,
        branding: TENANT_ORIGEM.branding,
      });
      return;
    }

    if (path === `/api/v1/comercial/clientes/${ALUNO.id}/contexto-operacional` && method === "GET") {
      const baseTenant = baseTenantId === TENANT_DESTINO.id ? TENANT_DESTINO : TENANT_ORIGEM;
      await fulfillJson(route, {
        tenantId: currentTenantId,
        tenantNome: currentTenantId === TENANT_DESTINO.id ? TENANT_DESTINO.nome : TENANT_ORIGEM.nome,
        baseTenantId: baseTenant.id,
        baseTenantNome: baseTenant.nome,
        aluno: {
          ...ALUNO,
          tenantId: baseTenant.id,
        },
        eligibleTenants: [
          { tenantId: TENANT_ORIGEM.id, tenantNome: TENANT_ORIGEM.nome, defaultTenant: baseTenant.id === TENANT_ORIGEM.id },
          { tenantId: TENANT_DESTINO.id, tenantNome: TENANT_DESTINO.nome, defaultTenant: baseTenant.id === TENANT_DESTINO.id },
        ],
        blockedTenants: [],
        blocked: false,
      });
      return;
    }

    if (path === `/api/v1/comercial/clientes/${ALUNO.id}/migrar-unidade` && method === "POST") {
      const payload = parseBody<{ tenantDestinoId?: string; justificativa?: string }>(request);
      if (!payload.tenantDestinoId?.trim() || !payload.justificativa?.trim()) {
        await fulfillJson(route, { message: "Destino e justificativa são obrigatórios." }, 422);
        return;
      }

      const next = migrationResponses.shift();
      if (next) {
        await fulfillJson(route, next.body, next.status);
        return;
      }

      baseTenantId = payload.tenantDestinoId;
      currentTenantId = payload.tenantDestinoId;
      await fulfillJson(route, {
        success: true,
        auditId: "audit-migracao-123",
        message: "Migração concluída com sucesso.",
        tenantOrigemId: TENANT_ORIGEM.id,
        tenantOrigemNome: TENANT_ORIGEM.nome,
        tenantDestinoId: TENANT_DESTINO.id,
        tenantDestinoNome: TENANT_DESTINO.nome,
        suggestedActiveTenantId: TENANT_DESTINO.id,
      });
      return;
    }

    if (
      (path === `/api/v1/comercial/alunos/${ALUNO.id}/adesoes`
        || path === `/api/v1/comercial/alunos/${ALUNO.id}/matriculas`)
      && method === "GET"
    ) {
      await fulfillJson(route, []);
      return;
    }

    if (
      path === "/api/v1/comercial/planos"
      || path === "/api/v1/comercial/pagamentos"
      || path === "/api/v1/administrativo/convenios"
      || path === "/api/v1/gerencial/financeiro/formas-pagamento"
      || path === `/api/v1/comercial/alunos/${ALUNO.id}/presencas`
      || path === `/api/v1/comercial/alunos/${ALUNO.id}/cartoes`
      || path === "/api/v1/comercial/bandeiras-cartao"
    ) {
      await fulfillJson(route, []);
      return;
    }

    await fulfillJson(route, { message: `Unhandled ${method} ${path}` }, 404);
  });
}

test.describe("Migração administrativa de unidade-base", () => {
  test("conclui a migração, troca o contexto ativo e atualiza o resumo estrutural", async ({ page }) => {
    await installClienteMigrationMocks(page);
    await seedAuthenticatedSession(page, {
      tenantId: TENANT_ORIGEM.id,
      tenantName: TENANT_ORIGEM.nome,
      availableTenants: [
        { tenantId: TENANT_ORIGEM.id, defaultTenant: true },
        { tenantId: TENANT_DESTINO.id, defaultTenant: false },
      ],
    });

    await page.goto(`/clientes/${ALUNO.id}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: ALUNO.nome })).toBeVisible();
    await expect(page.getByText("Unidade-base")).toBeVisible();
    await expect(page.getByText(TENANT_ORIGEM.nome).first()).toBeVisible();

    await page.locator("button.h-9.px-2").click();
    await page.getByRole("button", { name: "Migrar unidade-base" }).click();

    const modal = page.getByRole("dialog");
    await modal.locator("select").selectOption(TENANT_DESTINO.id);
    await modal.locator("textarea").fill("Cliente passou a operar definitivamente na nova unidade.");
    await modal.getByRole("button", { name: "Confirmar migração" }).click();

    // Timeout elevado: após `setTenant`, o workspace invalida queries e
    // recarrega todo o contexto, o que pode atrasar a renderização do
    // banner de migração sob carga paralela.
    await expect(page.getByText(`Unidade-base migrada de ${TENANT_ORIGEM.nome} para ${TENANT_DESTINO.nome}.`)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Migração concluída com sucesso. Auditoria: audit-migracao-123.")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(TENANT_DESTINO.nome).first()).toBeVisible();
  });

  test("mantém o modal aberto quando o backend bloqueia a migração", async ({ page }) => {
    await installClienteMigrationMocks(page, {
      migrationResponses: [
        {
          status: 409,
          body: {
            message: "Cliente com dependências abertas.",
            blockedBy: [{ code: "OPEN_CONTRACT", message: "Existe contrato pendente de assinatura na unidade atual." }],
          },
        },
      ],
    });
    await seedAuthenticatedSession(page, {
      tenantId: TENANT_ORIGEM.id,
      tenantName: TENANT_ORIGEM.nome,
      availableTenants: [
        { tenantId: TENANT_ORIGEM.id, defaultTenant: true },
        { tenantId: TENANT_DESTINO.id, defaultTenant: false },
      ],
    });

    await page.goto(`/clientes/${ALUNO.id}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: ALUNO.nome })).toBeVisible();

    await page.locator("button.h-9.px-2").click();
    await page.getByRole("button", { name: "Migrar unidade-base" }).click();

    const modal = page.getByRole("dialog");
    await modal.locator("select").selectOption(TENANT_DESTINO.id);
    await modal.locator("textarea").fill("Tentativa de migração estrutural.");
    await modal.getByRole("button", { name: "Confirmar migração" }).click();

    await expect(
      modal.getByRole("listitem").filter({ hasText: "Existe contrato pendente de assinatura na unidade atual." })
    ).toBeVisible();
    await expect(page.getByText(`Unidade-base migrada de ${TENANT_ORIGEM.nome} para ${TENANT_DESTINO.nome}.`)).toHaveCount(0);
  });
});
