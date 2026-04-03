import { expect, test, type Page } from "@playwright/test";
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

type UserSeed = {
  id: string;
  nome: string;
  email: string;
  active: boolean;
  lastLoginAt?: string;
  userKind: string;
  roles: string[];
  memberships: Array<{
    id: string;
    tenantId: string;
    active: boolean;
    defaultTenant: boolean;
    accessOrigin: "MANUAL" | "HERDADO_POLITICA";
    profiles: Array<{ perfilId: string; roleName: string; displayName: string }>;
  }>;
  policy: {
    enabled: boolean;
    scope: "ACADEMIA_ATUAL" | "REDE";
    rationale?: string;
    updatedAt?: string;
  };
};

type AuditEntrySeed = {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: "IMPERSONOU" | "ENCERROU_IMPERSONACAO";
  entityType: "USUARIO";
  entityId: string;
  entityName: string;
  detalhes?: string;
};

type State = {
  academias: AcademiaSeed[];
  tenants: TenantSeed[];
  adminUser: UserSeed;
  targetUser: UserSeed;
  audit: AuditEntrySeed[];
};

function normalizedPath(path: string) {
  return path.replace(/^\/backend/, "");
}

function buildState(): State {
  return {
    academias: [
      { id: "academia-norte", nome: "Rede Norte", ativo: true },
    ],
    tenants: [
      { id: "tenant-centro", academiaId: "academia-norte", groupId: "academia-norte", nome: "Unidade Centro", ativo: true },
    ],
    adminUser: {
      id: "user-root",
      nome: "Root Admin",
      email: "root@qa.local",
      active: true,
      userKind: "COLABORADOR",
      roles: ["OWNER", "ADMIN"],
      memberships: [
        {
          id: "membership-root",
          tenantId: "tenant-centro",
          active: true,
          defaultTenant: true,
          accessOrigin: "MANUAL",
          profiles: [{ perfilId: "perfil-admin-centro", roleName: "ADMIN", displayName: "Administrador" }],
        },
      ],
      policy: {
        enabled: true,
        scope: "REDE",
        rationale: "Backoffice global",
        updatedAt: "2026-03-27T09:00:00",
      },
    },
    targetUser: {
      id: "user-bruno",
      nome: "Bruno Suporte",
      email: "bruno.suporte@qa.local",
      active: true,
      lastLoginAt: "2026-03-27T08:30:00",
      userKind: "COLABORADOR",
      roles: ["USER"],
      memberships: [
        {
          id: "membership-bruno",
          tenantId: "tenant-centro",
          active: true,
          defaultTenant: true,
          accessOrigin: "MANUAL",
          profiles: [{ perfilId: "perfil-gerente-centro", roleName: "GERENTE", displayName: "Gerente" }],
        },
      ],
      policy: {
        enabled: false,
        scope: "ACADEMIA_ATUAL",
        updatedAt: "2026-03-26T15:00:00",
      },
    },
    audit: [],
  };
}

function buildDetail(state: State, user: UserSeed) {
  const tenant = state.tenants.find((item) => item.id === user.memberships[0]?.tenantId);
  const academia = state.academias.find((item) => item.id === tenant?.academiaId);
  return {
    id: user.id,
    name: user.nome,
    fullName: user.nome,
    email: user.email,
    userKind: user.userKind,
    networkId: "rede-norte",
    networkName: "Rede Norte",
    networkSubdomain: "rede-norte",
    networkSlug: "rede-norte",
    scopeType: "UNIDADE",
    loginIdentifiers: [
      { label: "E-mail", value: user.email },
    ],
    domainLinksSummary: ["Visão operacional local"],
    status: user.active ? "ATIVO" : "INATIVO",
    active: user.active,
    academias: [{ id: academia?.id, nome: academia?.nome }],
    membershipsAtivos: 1,
    membershipsTotal: 1,
    perfis: user.memberships[0]?.profiles.map((profile) => ({ displayName: profile.displayName })) ?? [],
    defaultTenantId: tenant?.id,
    defaultTenantName: tenant?.nome,
    activeTenantId: tenant?.id,
    activeTenantName: tenant?.nome,
    eligibleForNewUnits: user.policy.enabled,
    broadAccess: false,
    lastLoginAt: user.lastLoginAt,
    memberships: user.memberships.map((membership) => ({
      id: membership.id,
      userId: user.id,
      tenantId: membership.tenantId,
      tenantName: tenant?.nome ?? "Unidade Centro",
      networkId: "rede-norte",
      networkName: "Rede Norte",
      networkSubdomain: "rede-norte",
      networkSlug: "rede-norte",
      scopeType: "UNIDADE",
      academiaId: academia?.id,
      academiaName: academia?.nome ?? "Rede Norte",
      active: membership.active,
      defaultTenant: membership.defaultTenant,
      accessOrigin: membership.accessOrigin,
      tenantBaseId: tenant?.id,
      tenantBaseName: tenant?.nome,
      activeTenantId: tenant?.id,
      activeTenantName: tenant?.nome,
      profiles: membership.profiles.map((profile) => ({
        perfilId: profile.perfilId,
        roleName: profile.roleName,
        displayName: profile.displayName,
        active: true,
        inherited: false,
      })),
      availableProfiles: membership.profiles.map((profile) => ({
        id: profile.perfilId,
        tenantId: membership.tenantId,
        roleName: profile.roleName,
        displayName: profile.displayName,
        active: true,
      })),
      updatedAt: "2026-03-27T09:00:00",
    })),
    policy: {
      enabled: user.policy.enabled,
      scope: user.policy.scope,
      rationale: user.policy.rationale,
      updatedAt: user.policy.updatedAt,
    },
    exceptions: [],
    recentChanges: [],
  };
}

function authUserPayload(user: UserSeed) {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    roles: user.roles,
    userKind: user.userKind,
    activeTenantId: user.memberships[0]?.tenantId,
    availableTenants: user.memberships.map((membership, index) => ({
      tenantId: membership.tenantId,
      defaultTenant: membership.defaultTenant || index === 0,
    })),
    capabilities: {
      canAccessElevatedModules: user.roles.includes("ADMIN") || user.roles.includes("OWNER"),
    },
  };
}

function seedSession(page: Page, state: State) {
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
      tenants: state.tenants,
      user: {
        id: state.adminUser.id,
        userId: state.adminUser.id,
        nome: state.adminUser.nome,
        displayName: state.adminUser.nome,
        email: state.adminUser.email,
        roles: state.adminUser.roles,
        userKind: state.adminUser.userKind,
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

async function setupMocks(page: Page, state: State) {
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = normalizedPath(url.pathname);
    const method = request.method();
    const authHeader = request.headers()["authorization"] ?? "";
    const isImpersonated = authHeader.includes("token-bruno-impersonado");

    if (path === "/api/v1/auth/me" && method === "GET") {
      await route.fulfill({
        status: 200,
        json: authUserPayload(isImpersonated ? state.targetUser : state.adminUser),
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
      await route.fulfill({ status: 200, json: state.academias });
      return;
    }

    if (path === "/api/v1/admin/unidades" && method === "GET") {
      await route.fulfill({ status: 200, json: state.tenants });
      return;
    }

    if (path === "/api/v1/admin/seguranca/usuarios/user-bruno" && method === "GET") {
      await route.fulfill({ status: 200, json: buildDetail(state, state.targetUser) });
      return;
    }

    if (path === "/api/v1/administrativo/audit-log/usuarios/user-bruno/impersonate" && method === "POST") {
      state.audit.unshift({
        id: `audit-${state.audit.length + 1}`,
        timestamp: "2026-03-27T14:00:00",
        userId: state.adminUser.id,
        userName: state.adminUser.nome,
        action: "IMPERSONOU",
        entityType: "USUARIO",
        entityId: state.targetUser.id,
        entityName: state.targetUser.nome,
        detalhes: "Impersonação iniciada para suporte e diagnóstico.",
      });
      await route.fulfill({
        status: 200,
        json: {
          auditContextId: "audit-imp-1",
          targetUserId: state.targetUser.id,
          targetUserName: state.targetUser.nome,
          redirectTo: "/dashboard",
          session: {
            token: "token-bruno-impersonado",
            refreshToken: "refresh-bruno-impersonado",
            type: "Bearer",
            userId: state.targetUser.id,
            userKind: state.targetUser.userKind,
            displayName: state.targetUser.nome,
            redeId: "rede-norte",
            redeSubdominio: "rede-norte",
            redeNome: "Rede Norte",
            activeTenantId: "tenant-centro",
            tenantBaseId: "tenant-centro",
            availableTenants: [{ tenantId: "tenant-centro", defaultTenant: true }],
            availableScopes: ["UNIDADE"],
            broadAccess: false,
          },
        },
      });
      return;
    }

    if (path === "/api/v1/administrativo/audit-log/impersonation/end" && method === "POST") {
      state.audit.unshift({
        id: `audit-${state.audit.length + 1}`,
        timestamp: "2026-03-27T14:12:00",
        userId: state.adminUser.id,
        userName: state.adminUser.nome,
        action: "ENCERROU_IMPERSONACAO",
        entityType: "USUARIO",
        entityId: state.targetUser.id,
        entityName: state.targetUser.nome,
        detalhes: "Impersonação encerrada e sessão original restaurada.",
      });
      await route.fulfill({ status: 204, body: "" });
      return;
    }

    if (path === "/api/v1/administrativo/audit-log" && method === "GET") {
      await route.fulfill({
        status: 200,
        json: {
          items: state.audit,
          page: 0,
          size: 20,
          total: state.audit.length,
          hasNext: false,
        },
      });
      return;
    }

    if (path === "/api/v1/academia/dashboard" && method === "GET") {
      await route.fulfill({
        status: 200,
        json: {
          totalAlunosAtivos: isImpersonated ? 7 : 1,
          prospectsNovos: isImpersonated ? 3 : 0,
          matriculasDoMes: isImpersonated ? 2 : 0,
          receitaDoMes: isImpersonated ? 1850 : 0,
          statusAlunoCount: {
            ATIVO: isImpersonated ? 7 : 1,
            SUSPENSO: 0,
            INATIVO: 1,
            CANCELADO: 0,
          },
          prospectsRecentes: [],
          matriculasVencendo: [],
          pagamentosPendentes: [],
        },
      });
      return;
    }

    await route.fulfill({ status: 404, json: { message: `Unhandled ${method} ${path}` } });
  });
}

test.describe("Backoffice impersonation", () => {
  test("inicia impersonação, abre o app com banner e encerra com trilha no audit log", async ({ page }) => {
    const state = buildState();
    await seedSession(page, state);
    await setupMocks(page, state);

    await page.goto("/admin/seguranca/usuarios/user-bruno", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Entrar como este usuário" })).toBeVisible();

    await page.getByRole("button", { name: "Entrar como este usuário" }).click();
    await page.getByLabel("Justificativa obrigatória").fill("Suporte operacional para reproduzir o contexto do gerente.");
    await page.getByRole("button", { name: "Confirmar e entrar como usuário" }).click();

    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByText("Você está operando como Bruno Suporte")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("7")).toBeVisible();

    await page.getByRole("button", { name: "Encerrar impersonação" }).click();
    await expect(page).toHaveURL(/\/admin\/seguranca\/usuarios\/user-bruno$/);
    await expect(page.getByRole("button", { name: "Entrar como este usuário" })).toBeVisible();

    await page.goto("/admin/audit-log", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Impersonou")).toBeVisible();
    await expect(page.getByText("Encerrou impersonação")).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "Bruno Suporte" }).first()).toBeVisible();
  });
});
