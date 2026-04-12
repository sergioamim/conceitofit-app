import { expect, test, type Page } from "./support/test";
import { installBackofficeGlobalSession } from "./support/backoffice-global-session";

type ExceptionSeed = {
  id: string;
  title: string;
  scopeLabel?: string;
  justification: string;
  expiresAt?: string;
  createdAt?: string;
  createdBy?: string;
  active: boolean;
};

type State = {
  exceptions: ExceptionSeed[];
};

function seedSession(page: Page) {
  return installBackofficeGlobalSession(page, {
    session: {
      activeTenantId: "tenant-centro",
      baseTenantId: "tenant-centro",
      availableTenants: [{ tenantId: "tenant-centro", defaultTenant: true }],
      userId: "user-root",
      userKind: "COLABORADOR",
      displayName: "Root Admin",
      roles: ["OWNER", "ADMIN"],
      availableScopes: ["GLOBAL"],
      broadAccess: true,
    },
    shell: {
      currentTenantId: "tenant-centro",
      tenants: [
        {
          id: "tenant-centro",
          academiaId: "academia-norte",
          groupId: "academia-norte",
          nome: "Unidade Centro",
          ativo: true,
        },
      ],
      user: {
        id: "user-root",
        userId: "user-root",
        nome: "Root Admin",
        displayName: "Root Admin",
        email: "root@qa.local",
        roles: ["OWNER", "ADMIN"],
        userKind: "COLABORADOR",
        activeTenantId: "tenant-centro",
        tenantBaseId: "tenant-centro",
        availableScopes: ["GLOBAL"],
        broadAccess: true,
        redeId: "academia-norte",
        redeNome: "Rede Norte",
        redeSlug: "rede-norte",
      },
      academia: {
        id: "academia-norte",
        nome: "Rede Norte",
        ativo: true,
      },
      capabilities: {
        canAccessElevatedModules: true,
      },
    },
  });
}

function normalizedPath(path: string) {
  return path.replace(/^\/backend/, "");
}

function parseBody<T = unknown>(raw: string | null): T {
  try {
    return raw ? (JSON.parse(raw) as T) : ({} as T);
  } catch {
    return {} as T;
  }
}

function buildState(): State {
  return {
    exceptions: [
      {
        id: "exception-1",
        title: "Auditoria externa",
        scopeLabel: "Rede Norte",
        justification: "Cobertura temporária para consultoria.",
        expiresAt: "2026-03-25T18:00:00",
        createdAt: "2026-03-12T09:00:00",
        createdBy: "Compliance",
        active: true,
      },
    ],
  };
}

function buildUserSummary(state: State) {
  return {
    id: "user-ana",
    nome: "Ana Admin",
    email: "ana.admin@qa.local",
    active: true,
    status: "ATIVO",
    academias: [{ id: "academia-norte", nome: "Rede Norte" }],
    membershipsAtivos: 1,
    membershipsTotal: 1,
    profiles: [{ displayName: "Administrador" }],
    defaultTenantId: "tenant-centro",
    defaultTenantName: "Unidade Centro",
    eligibleForNewUnits: true,
    broadAccess: true,
    compatibilityMode: true,
    riskLevel: "ALTO",
    riskFlags: ["acesso regional temporário"],
    exceptionsCount: state.exceptions.length,
    reviewStatus: "PENDENTE",
    nextReviewAt: "2026-03-20T10:00:00",
  };
}

function buildUserDetail(state: State) {
  return {
    ...buildUserSummary(state),
    lastLoginAt: "2026-03-12T10:00:00",
    memberships: [
      {
        id: "membership-centro",
        userId: "user-ana",
        tenantId: "tenant-centro",
        tenantName: "Unidade Centro",
        academiaId: "academia-norte",
        academiaName: "Rede Norte",
        active: true,
        defaultTenant: true,
        accessOrigin: "MANUAL",
        eligibleForNewUnits: true,
        broadAccess: true,
        riskLevel: "ALTO",
        riskFlags: ["alçada regional"],
        reviewStatus: "PENDENTE",
        nextReviewAt: "2026-03-20T10:00:00",
        profiles: [
          {
            perfilId: "perfil-admin-centro",
            roleName: "ADMIN",
            displayName: "Administrador",
            active: true,
            inherited: false,
          },
        ],
        availableProfiles: [
          {
            id: "perfil-admin-centro",
            tenantId: "tenant-centro",
            roleName: "ADMIN",
            displayName: "Administrador",
            active: true,
          },
        ],
        exceptions: [],
        updatedAt: "2026-03-12T10:30:00",
      },
    ],
    exceptions: state.exceptions,
    recentChanges: [
      {
        id: "change-1",
        title: "Perfil elevado em Centro",
        description: "Administrador concedido para fechamento do mês.",
        happenedAt: "2026-03-12T12:00:00",
        actorName: "Root Admin",
        severity: "MEDIO",
      },
    ],
    policy: {
      enabled: true,
      scope: "ACADEMIA_ATUAL",
      rationale: "Coordenação regional",
      sourceLabel: "Governança regional",
      updatedAt: "2026-03-12T10:00:00",
    },
  };
}

async function setupMocks(page: Page, state: State) {
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = normalizedPath(url.pathname);
    const method = request.method();

    if (path === "/api/v1/auth/me" && method === "GET") {
      await route.fulfill({
        status: 200,
        json: {
          id: "user-root",
          nome: "Root Admin",
          email: "root@qa.local",
          roles: ["OWNER", "ADMIN"],
          activeTenantId: "tenant-centro",
          availableTenants: [{ tenantId: "tenant-centro", defaultTenant: true }],
        },
      });
      return;
    }

    if (path === "/api/v1/context/unidade-ativa" && method === "GET") {
      await route.fulfill({
        status: 200,
        json: {
          currentTenantId: "tenant-centro",
          tenantAtual: {
            id: "tenant-centro",
            academiaId: "academia-norte",
            groupId: "academia-norte",
            nome: "Unidade Centro",
            ativo: true,
          },
          unidadesDisponiveis: [
            {
              id: "tenant-centro",
              academiaId: "academia-norte",
              groupId: "academia-norte",
              nome: "Unidade Centro",
              ativo: true,
            },
          ],
        },
      });
      return;
    }

    if (path === "/api/v1/admin/academias" && method === "GET") {
      await route.fulfill({
        status: 200,
        json: [{ id: "academia-norte", nome: "Rede Norte", ativo: true }],
      });
      return;
    }

    if (path === "/api/v1/admin/unidades" && method === "GET") {
      await route.fulfill({
        status: 200,
        json: [
          {
            id: "tenant-centro",
            academiaId: "academia-norte",
            groupId: "academia-norte",
            nome: "Unidade Centro",
            ativo: true,
          },
          {
            id: "tenant-barra",
            academiaId: "academia-norte",
            groupId: "academia-norte",
            nome: "Unidade Barra",
            ativo: true,
          },
        ],
      });
      return;
    }

    if (path === "/api/v1/admin/seguranca/overview" && method === "GET") {
      await route.fulfill({
        status: 200,
        json: {
          totalUsers: 1,
          activeMemberships: 1,
          defaultUnitsConfigured: 1,
          eligibleForNewUnits: 1,
          broadAccessUsers: 1,
          expiringExceptions: state.exceptions.length,
          pendingReviews: 1,
          rolloutPercentage: 68,
          compatibilityModeUsers: 1,
        },
      });
      return;
    }

    if (path === "/api/v1/admin/seguranca/reviews" && method === "GET") {
      await route.fulfill({
        status: 200,
        json: {
          pendingReviews: [
            {
              id: "review-1",
              userId: "user-ana",
              userName: "Ana Admin",
              title: "Recertificar acesso amplo",
              description: "Acesso regional precisa de nova validação.",
              severity: "ALTO",
              dueAt: "2026-03-20T10:00:00",
              category: "REVISAO_PENDENTE",
            },
          ],
          expiringExceptions: state.exceptions.map((exception) => ({
            id: `exp-${exception.id}`,
            userId: "user-ana",
            userName: "Ana Admin",
            title: exception.title,
            description: exception.justification,
            severity: "MEDIO",
            dueAt: exception.expiresAt,
            category: "EXCECAO_EXPIRANDO",
          })),
          recentChanges: [],
          broadAccess: [],
          orphanProfiles: [],
        },
      });
      return;
    }

    if (path === "/api/v1/admin/seguranca/usuarios" && method === "GET") {
      await route.fulfill({
        status: 200,
        json: {
          page: 0,
          size: 20,
          total: 1,
          hasNext: false,
          items: [buildUserSummary(state)],
        },
      });
      return;
    }

    if (path === "/api/v1/admin/seguranca/usuarios/user-ana" && method === "GET") {
      await route.fulfill({ status: 200, json: buildUserDetail(state) });
      return;
    }

    if (path === "/api/v1/admin/seguranca/usuarios/user-ana/exceptions" && method === "POST") {
      const body = parseBody<{
        title?: string;
        scopeLabel?: string;
        justification?: string;
        expiresAt?: string;
      }>(request.postData());
      state.exceptions.push({
        id: `exception-${state.exceptions.length + 1}`,
        title: body.title ?? "Sem título",
        scopeLabel: body.scopeLabel,
        justification: body.justification ?? "Sem justificativa",
        expiresAt: body.expiresAt,
        createdAt: "2026-03-13T10:00:00",
        createdBy: "Root Admin",
        active: true,
      });
      await route.fulfill({ status: 200, json: buildUserDetail(state) });
      return;
    }

    if (/^\/api\/v1\/admin\/seguranca\/usuarios\/user-ana\/exceptions\/[^/]+$/.test(path) && method === "DELETE") {
      const exceptionId = path.split("/").at(-1) ?? "";
      state.exceptions = state.exceptions.filter((item) => item.id !== exceptionId);
      await route.fulfill({ status: 200, json: buildUserDetail(state) });
      return;
    }

    await route.fulfill({ status: 404, json: { message: `Sem stub para ${method} ${path}` } });
  });
}

test.describe("Backoffice segurança rollout", () => {
  test.setTimeout(120_000);

  test("navega pela fila de revisões e registra exceção controlada", async ({ page }) => {
    const state = buildState();
    await seedSession(page);
    await setupMocks(page, state);

    await page.goto("/admin/seguranca", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Segurança global" })).toBeVisible({ timeout: 15_000 });

    await page.getByRole("link", { name: "Revisões e auditoria", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Revisões e auditoria" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Recertificar acesso amplo")).toBeVisible();

    await page.goto("/admin/seguranca/usuarios", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Usuários e acessos" })).toBeVisible({ timeout: 15_000 });
    await page.getByRole("link", { name: "Abrir governança" }).click();
    await page.waitForURL("**/admin/seguranca/usuarios/user-ana", { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Ana Admin" })).toBeVisible({ timeout: 15_000 });

    await page.getByRole("tab", { name: "Exceções" }).click();
    await expect(page.getByText("Auditoria externa")).toBeVisible();

    await page.getByLabel("Título").fill("Apoio de inventário");
    await page.getByLabel("Rótulo visível").fill("Cobertura regional");
    await page.getByLabel("Justificativa").fill("Suporte temporário durante inventário da rede.");
    await page.getByRole("button", { name: "Registrar exceção" }).click();

    await expect(page.getByText("Apoio de inventário")).toBeVisible();
    await page.getByRole("button", { name: "Remover exceção" }).last().click();
    await expect(page.getByText("Apoio de inventário")).not.toBeVisible();
  });
});
