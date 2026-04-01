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
  email?: string;
  documento?: string;
};

type ProfileSeed = {
  id: string;
  tenantId: string;
  roleName: string;
  displayName: string;
  active: boolean;
};

type MembershipSeed = {
  id: string;
  tenantId: string;
  active: boolean;
  defaultTenant: boolean;
  accessOrigin: "MANUAL" | "HERDADO_POLITICA";
  inheritedFrom?: string;
  profiles: Array<{ perfilId: string; inherited?: boolean }>;
};

type UserSeed = {
  id: string;
  nome: string;
  email: string;
  active: boolean;
  lastLoginAt?: string;
  policy: {
    enabled: boolean;
    scope: "ACADEMIA_ATUAL" | "REDE";
    rationale?: string;
    updatedAt?: string;
  };
  memberships: MembershipSeed[];
};

type OnboardingSeed = {
  tenantId: string;
  academiaId: string;
  estrategia: "IMPORTAR_DEPOIS";
  status: "AGUARDANDO_IMPORTACAO" | "PRONTA";
  evoFilialId?: string;
  criadoEm: string;
  atualizadoEm: string;
  eventos: [];
};

type State = {
  academias: AcademiaSeed[];
  tenants: TenantSeed[];
  profiles: ProfileSeed[];
  users: UserSeed[];
  onboarding: OnboardingSeed[];
};

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

function buildInitialState(): State {
  return {
    academias: [
      { id: "academia-norte", nome: "Rede Norte", ativo: true },
    ],
    tenants: [
      {
        id: "tenant-centro",
        academiaId: "academia-norte",
        groupId: "academia-norte",
        nome: "Unidade Centro",
        ativo: true,
        email: "centro@qa.local",
        documento: "12.345.678/0001-90",
      },
      {
        id: "tenant-barra",
        academiaId: "academia-norte",
        groupId: "academia-norte",
        nome: "Unidade Barra",
        ativo: true,
        email: "barra@qa.local",
        documento: "12.345.678/0001-90",
      },
    ],
    profiles: [
      {
        id: "perfil-admin-centro",
        tenantId: "tenant-centro",
        roleName: "ADMIN",
        displayName: "Administrador",
        active: true,
      },
      {
        id: "perfil-gerente-centro",
        tenantId: "tenant-centro",
        roleName: "GERENTE",
        displayName: "Gerente",
        active: true,
      },
      {
        id: "perfil-admin-barra",
        tenantId: "tenant-barra",
        roleName: "ADMIN",
        displayName: "Administrador",
        active: true,
      },
      {
        id: "perfil-gerente-barra",
        tenantId: "tenant-barra",
        roleName: "GERENTE",
        displayName: "Gerente",
        active: true,
      },
    ],
    users: [
      {
        id: "user-ana",
        nome: "Ana Admin",
        email: "ana.admin@qa.local",
        active: true,
        lastLoginAt: "2026-03-12T10:00:00",
        policy: {
          enabled: true,
          scope: "ACADEMIA_ATUAL",
          rationale: "Coordenação regional",
          updatedAt: "2026-03-12T10:00:00",
        },
        memberships: [
          {
            id: "membership-centro",
            tenantId: "tenant-centro",
            active: true,
            defaultTenant: true,
            accessOrigin: "MANUAL",
            profiles: [{ perfilId: "perfil-admin-centro" }],
          },
        ],
      },
      {
        id: "user-bruno",
        nome: "Bruno Suporte",
        email: "bruno.suporte@qa.local",
        active: true,
        lastLoginAt: "2026-03-11T09:00:00",
        policy: {
          enabled: false,
          scope: "ACADEMIA_ATUAL",
          updatedAt: "2026-03-11T09:00:00",
        },
        memberships: [
          {
            id: "membership-centro-bruno",
            tenantId: "tenant-centro",
            active: true,
            defaultTenant: true,
            accessOrigin: "MANUAL",
            profiles: [{ perfilId: "perfil-gerente-centro" }],
          },
        ],
      },
    ],
    onboarding: [
      {
        tenantId: "tenant-barra",
        academiaId: "academia-norte",
        estrategia: "IMPORTAR_DEPOIS",
        status: "AGUARDANDO_IMPORTACAO",
        evoFilialId: "EVO-204",
        criadoEm: "2026-03-12T08:00:00",
        atualizadoEm: "2026-03-12T08:00:00",
        eventos: [],
      },
    ],
  };
}

function tenantById(state: State, tenantId: string) {
  return state.tenants.find((tenant) => tenant.id === tenantId);
}

function academiaById(state: State, academiaId?: string) {
  return state.academias.find((academia) => academia.id === academiaId);
}

function profileById(state: State, perfilId: string) {
  return state.profiles.find((profile) => profile.id === perfilId);
}

function availableProfilesForTenant(state: State, tenantId: string) {
  return state.profiles.filter((profile) => profile.tenantId === tenantId);
}

function buildUserSummary(state: State, user: UserSeed) {
  const activeMemberships = user.memberships.filter((membership) => membership.active);
  const tenantIds = [...new Set(activeMemberships.map((membership) => membership.tenantId))];
  const activeTenant = activeMemberships[0] ? tenantById(state, activeMemberships[0].tenantId) : null;
  const academias = tenantIds
    .map((tenantId) => tenantById(state, tenantId))
    .filter((tenant): tenant is TenantSeed => Boolean(tenant))
    .map((tenant) => ({
      id: tenant.academiaId,
      nome: academiaById(state, tenant.academiaId)?.nome ?? "Academia não informada",
    }));
  const perfis = activeMemberships.flatMap((membership) =>
    membership.profiles
      .map((profile) => profileById(state, profile.perfilId)?.displayName)
      .filter((value): value is string => Boolean(value))
  );
  const defaultMembership = user.memberships.find((membership) => membership.defaultTenant) ?? activeMemberships[0];
  const defaultTenant = defaultMembership ? tenantById(state, defaultMembership.tenantId) : null;

  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    userKind: "COLABORADOR",
    redeId: "rede-norte",
    redeNome: "Rede Norte",
    redeSlug: "rede-norte",
    scopeType: activeMemberships.length > 1 || user.policy.scope === "REDE" ? "REDE" : "UNIDADE",
    loginIdentifiers: [
      { label: "E-mail", value: user.email },
      { label: "CPF", value: "***.***.***-00" },
    ],
    domainLinksSummary: ["Grupo Norte (somente leitura)"],
    active: user.active,
    status: user.active ? "ATIVO" : "INATIVO",
    academias,
    membershipsAtivos: activeMemberships.length,
    membershipsTotal: user.memberships.length,
    profiles: [...new Set(perfis)].map((displayName) => ({ displayName })),
    defaultTenantId: defaultTenant?.id,
    defaultTenantName: defaultTenant?.nome,
    activeTenantId: activeTenant?.id,
    activeTenantName: activeTenant?.nome,
    eligibleForNewUnits: user.policy.enabled,
  };
}

function buildUserDetail(state: State, userId: string) {
  const user = state.users.find((item) => item.id === userId);
  if (!user) return null;
  const summary = buildUserSummary(state, user);
  const defaultTenant = summary.defaultTenantId ? tenantById(state, summary.defaultTenantId) : null;

  return {
    ...summary,
    lastLoginAt: user.lastLoginAt,
    memberships: user.memberships.map((membership) => {
      const tenant = tenantById(state, membership.tenantId);
      const academia = academiaById(state, tenant?.academiaId);
      return {
        id: membership.id,
        userId: user.id,
        tenantId: membership.tenantId,
        tenantName: tenant?.nome ?? "Unidade não informada",
        redeId: "rede-norte",
        redeNome: "Rede Norte",
        redeSlug: "rede-norte",
        scopeType: user.policy.scope === "REDE" ? "REDE" : "UNIDADE",
        academiaId: tenant?.academiaId,
        academiaName: academia?.nome ?? "Academia não informada",
        active: membership.active,
        defaultTenant: membership.defaultTenant,
        tenantBaseId: defaultTenant?.id,
        tenantBaseName: defaultTenant?.nome,
        activeTenantId: membership.tenantId,
        activeTenantName: tenant?.nome ?? "Unidade não informada",
        accessOrigin: membership.accessOrigin,
        inheritedFrom: membership.inheritedFrom,
        eligibleForNewUnits: user.policy.enabled,
        profiles: membership.profiles.map((profile) => {
          const profileInfo = profileById(state, profile.perfilId);
          return {
            perfilId: profile.perfilId,
            roleName: profileInfo?.roleName ?? "",
            displayName: profileInfo?.displayName ?? "",
            active: true,
            inherited: profile.inherited ?? false,
          };
        }),
        availableProfiles: availableProfilesForTenant(state, membership.tenantId),
        updatedAt: "2026-03-12T10:30:00",
      };
    }),
    policy: {
      enabled: user.policy.enabled,
      scope: user.policy.scope,
      rationale: user.policy.rationale,
      updatedAt: user.policy.updatedAt,
    },
  };
}

function buildOverview(state: State) {
  return {
    totalUsers: state.users.length,
    activeMemberships: state.users.reduce(
      (total, user) => total + user.memberships.filter((membership) => membership.active).length,
      0
    ),
    defaultUnitsConfigured: state.users.filter((user) => user.memberships.some((membership) => membership.defaultTenant))
      .length,
    eligibleForNewUnits: state.users.filter((user) => user.policy.enabled).length,
  };
}

function applyListFilters(state: State, url: URL) {
  const query = url.searchParams.get("query")?.trim().toLowerCase() ?? "";
  const tenantId = url.searchParams.get("tenantId")?.trim() ?? "";
  const academiaId = url.searchParams.get("academiaId")?.trim() ?? "";
  const status = url.searchParams.get("status")?.trim().toUpperCase() ?? "";
  const profile = url.searchParams.get("profile")?.trim().toLowerCase() ?? "";
  const scopeType = url.searchParams.get("scopeType")?.trim().toUpperCase() ?? "";
  const eligibleOnly = url.searchParams.get("eligibleForNewUnits") === "true";
  const page = Number(url.searchParams.get("page") ?? "0");
  const size = Number(url.searchParams.get("size") ?? "20");

  const items = state.users.filter((user) => {
    const summary = buildUserSummary(state, user);
    const loginIdentifiers = (summary.loginIdentifiers ?? []).map((item) => item.value.toLowerCase()).join(" ");
    if (query && !`${summary.nome} ${summary.email} ${loginIdentifiers}`.toLowerCase().includes(query)) return false;
    if (tenantId && !user.memberships.some((membership) => membership.tenantId === tenantId)) return false;
    if (academiaId) {
      const academiaIds = user.memberships
        .map((membership) => tenantById(state, membership.tenantId)?.academiaId)
        .filter((value): value is string => Boolean(value));
      if (!academiaIds.includes(academiaId)) return false;
    }
    if (status && status !== "TODOS" && (summary.status ?? "") !== status) return false;
    if (profile) {
      const names = summary.profiles.map((item) => item.displayName.toLowerCase());
      if (!names.some((name) => name.includes(profile))) return false;
    }
    if (scopeType && summary.scopeType !== scopeType) return false;
    if (eligibleOnly && !summary.eligibleForNewUnits) return false;
    return true;
  });

  const start = page * size;
  const paged = items.slice(start, start + size);
  return {
    page,
    size,
    total: items.length,
    hasNext: start + size < items.length,
    items: paged.map((user) => buildUserSummary(state, user)),
  };
}

async function setupBackofficeSecurityMocks(page: Page, state: State) {
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
      const tenant = tenantById(state, "tenant-centro");
      await route.fulfill({
        status: 200,
        json: {
          currentTenantId: "tenant-centro",
          tenantAtual: tenant,
          unidadesDisponiveis: tenant ? [tenant] : [],
        },
      });
      return;
    }

    if (path === "/api/v1/auth/perfis" && method === "GET") {
      const tenantId = url.searchParams.get("tenantId") ?? "";
      const items = state.profiles
        .filter((profile) => !tenantId || profile.tenantId === tenantId)
        .map((profile) => ({
          id: profile.id,
          tenantId: profile.tenantId,
          roleName: profile.roleName,
          displayName: profile.displayName,
          active: profile.active,
        }));
      await route.fulfill({
        status: 200,
        json: {
          page: 0,
          size: items.length,
          total: items.length,
          hasNext: false,
          items,
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

    if (path === "/api/v1/admin/unidades/onboarding" && method === "GET") {
      await route.fulfill({ status: 200, json: state.onboarding });
      return;
    }

    if (path === "/api/v1/admin/seguranca/overview" && method === "GET") {
      await route.fulfill({ status: 200, json: buildOverview(state) });
      return;
    }

    if (path === "/api/v1/admin/seguranca/usuarios" && method === "GET") {
      await route.fulfill({ status: 200, json: applyListFilters(state, url) });
      return;
    }

    if (path === "/api/v1/admin/seguranca/usuarios" && method === "POST") {
      const body = parseBody<{
        name?: string;
        email?: string;
        tenantIds?: string[];
        defaultTenantId?: string;
        eligibleForNewUnits?: boolean;
        policyScope?: "ACADEMIA_ATUAL" | "REDE";
      }>(request.postData());
      const tenantIds = body.tenantIds?.filter(Boolean) ?? [];
      if (!body.name || !body.email) {
        await route.fulfill({ status: 400, json: { message: "Nome e e-mail são obrigatórios." } });
        return;
      }
      const userId = `user-${state.users.length + 1}`;
      state.users.unshift({
        id: userId,
        nome: body.name,
        email: body.email,
        active: true,
        policy: {
          enabled: Boolean(body.eligibleForNewUnits),
          scope: body.policyScope ?? "ACADEMIA_ATUAL",
          updatedAt: "2026-03-20T09:00:00",
        },
        memberships: tenantIds.map((tenantId, index) => ({
          id: `membership-${userId}-${index + 1}`,
          tenantId,
          active: true,
          defaultTenant: body.defaultTenantId ? body.defaultTenantId === tenantId : index === 0,
          accessOrigin: "MANUAL",
          profiles: [],
        })),
      });
      await route.fulfill({ status: 201, json: buildUserDetail(state, userId) });
      return;
    }

    if (/^\/api\/v1\/admin\/seguranca\/usuarios\/[^/]+$/.test(path) && method === "GET") {
      const userId = path.split("/").at(-1) ?? "";
      const detail = buildUserDetail(state, userId);
      if (!detail) {
        await route.fulfill({ status: 404, json: { message: "Usuário não encontrado." } });
        return;
      }
      await route.fulfill({ status: 200, json: detail });
      return;
    }

    if (/^\/api\/v1\/admin\/seguranca\/usuarios\/[^/]+\/memberships$/.test(path) && method === "POST") {
      const userId = path.split("/")[6] ?? "";
      const body = parseBody<{ tenantId: string; defaultTenant?: boolean }>(request.postData());
      const user = state.users.find((item) => item.id === userId);
      if (!user || !body.tenantId) {
        await route.fulfill({ status: 400, json: { message: "Usuário ou unidade inválidos." } });
        return;
      }
      if (!user.memberships.some((membership) => membership.tenantId === body.tenantId)) {
        if (body.defaultTenant) {
          user.memberships.forEach((membership) => {
            membership.defaultTenant = false;
          });
        }
        user.memberships.push({
          id: `membership-${Date.now()}`,
          tenantId: body.tenantId,
          active: true,
          defaultTenant: Boolean(body.defaultTenant),
          accessOrigin: "MANUAL",
          profiles: [],
        });
      }
      await route.fulfill({ status: 200, json: buildUserDetail(state, userId) });
      return;
    }

    if (/^\/api\/v1\/admin\/seguranca\/usuarios\/[^/]+\/memberships\/[^/]+$/.test(path) && method === "PATCH") {
      const segments = path.split("/");
      const userId = segments[6] ?? "";
      const membershipId = segments[8] ?? "";
      const body = parseBody<{ active?: boolean; defaultTenant?: boolean }>(request.postData());
      const user = state.users.find((item) => item.id === userId);
      const membership = user?.memberships.find((item) => item.id === membershipId);
      if (!user || !membership) {
        await route.fulfill({ status: 404, json: { message: "Membership não encontrado." } });
        return;
      }
      if (typeof body.active === "boolean") {
        membership.active = body.active;
      }
      if (body.defaultTenant === true) {
        user.memberships.forEach((item) => {
          item.defaultTenant = item.id === membershipId;
        });
      }
      await route.fulfill({ status: 200, json: buildUserDetail(state, userId) });
      return;
    }

    if (/^\/api\/v1\/admin\/seguranca\/usuarios\/[^/]+\/memberships\/[^/]+$/.test(path) && method === "DELETE") {
      const segments = path.split("/");
      const userId = segments[6] ?? "";
      const membershipId = segments[8] ?? "";
      const user = state.users.find((item) => item.id === userId);
      if (!user) {
        await route.fulfill({ status: 404, json: { message: "Usuário não encontrado." } });
        return;
      }
      user.memberships = user.memberships.filter((membership) => membership.id !== membershipId);
      if (!user.memberships.some((membership) => membership.defaultTenant) && user.memberships[0]) {
        user.memberships[0].defaultTenant = true;
      }
      await route.fulfill({ status: 200, json: buildUserDetail(state, userId) });
      return;
    }

    if (
      /^\/api\/v1\/admin\/seguranca\/usuarios\/[^/]+\/memberships\/[^/]+\/perfis\/[^/]+$/.test(path) &&
      method === "PUT"
    ) {
      const segments = path.split("/");
      const userId = segments[6] ?? "";
      const membershipId = segments[8] ?? "";
      const perfilId = segments[10] ?? "";
      const user = state.users.find((item) => item.id === userId);
      const membership = user?.memberships.find((item) => item.id === membershipId);
      if (!user || !membership) {
        await route.fulfill({ status: 404, json: { message: "Membership não encontrado." } });
        return;
      }
      if (!membership.profiles.some((profile) => profile.perfilId === perfilId)) {
        membership.profiles.push({ perfilId });
      }
      await route.fulfill({ status: 200, json: buildUserDetail(state, userId) });
      return;
    }

    if (
      /^\/api\/v1\/admin\/seguranca\/usuarios\/[^/]+\/memberships\/[^/]+\/perfis\/[^/]+$/.test(path) &&
      method === "DELETE"
    ) {
      const segments = path.split("/");
      const userId = segments[6] ?? "";
      const membershipId = segments[8] ?? "";
      const perfilId = segments[10] ?? "";
      const user = state.users.find((item) => item.id === userId);
      const membership = user?.memberships.find((item) => item.id === membershipId);
      if (!user || !membership) {
        await route.fulfill({ status: 404, json: { message: "Membership não encontrado." } });
        return;
      }
      membership.profiles = membership.profiles.filter((profile) => profile.perfilId !== perfilId);
      await route.fulfill({ status: 200, json: buildUserDetail(state, userId) });
      return;
    }

    if (/^\/api\/v1\/admin\/seguranca\/usuarios\/[^/]+\/policy\/new-units$/.test(path) && method === "PUT") {
      const userId = path.split("/")[6] ?? "";
      const body = parseBody<{ enabled: boolean; scope: "ACADEMIA_ATUAL" | "REDE"; rationale?: string }>(
        request.postData()
      );
      const user = state.users.find((item) => item.id === userId);
      if (!user) {
        await route.fulfill({ status: 404, json: { message: "Usuário não encontrado." } });
        return;
      }
      user.policy = {
        enabled: body.enabled,
        scope: body.scope,
        rationale: body.rationale,
        updatedAt: "2026-03-13T09:30:00",
      };
      await route.fulfill({ status: 200, json: buildUserDetail(state, userId) });
      return;
    }

    await route.fulfill({ status: 404, json: { message: `Sem stub para ${method} ${path}` } });
  });
}

function seedSession(page: Page, state: State) {
  return installBackofficeGlobalSession(page, {
    session: {
      refreshToken: "refresh-backoffice-security",
      type: "Bearer",
      activeTenantId: "tenant-centro",
      baseTenantId: "tenant-centro",
      preferredTenantId: "tenant-centro",
      availableTenants: [{ tenantId: "tenant-centro", defaultTenant: true }],
      userId: "backoffice-root",
      userKind: "COLABORADOR",
      displayName: "Admin Segurança",
      roles: ["SUPER_ADMIN"],
      availableScopes: ["GLOBAL"],
      broadAccess: true,
    },
    shell: {
      currentTenantId: "tenant-centro",
      tenants: state.tenants,
      user: {
        id: "backoffice-root",
        userId: "backoffice-root",
        nome: "Admin Segurança",
        displayName: "Admin Segurança",
        email: "admin.seguranca@qa.local",
        roles: ["SUPER_ADMIN"],
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

test.describe("Backoffice segurança global", () => {
  test.setTimeout(120000);

  test("opera memberships, perfis e política e reflete a elegibilidade em unidades e onboarding", async ({ page }) => {
    const state = buildInitialState();
    await seedSession(page, state);
    await setupBackofficeSecurityMocks(page, state);

    await page.goto("/admin/seguranca");
    await expect(page.getByRole("heading", { name: "Segurança global" })).toBeVisible();
    await expect(page.getByText("Política ativa para novas unidades")).toBeVisible();

    await page.goto("/admin/seguranca/usuarios");
    await expect(page.getByRole("heading", { name: "Usuários e acessos" })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "Ana Admin" })).toBeVisible();

    await page.goto("/admin/seguranca/usuarios/user-ana", { waitUntil: "domcontentloaded" }).catch(async () => {
      await page.goto("/admin/seguranca/usuarios/user-ana", { waitUntil: "domcontentloaded" });
    });
    await expect(page.getByRole("heading", { name: "Ana Admin" })).toBeVisible();

    await page.getByRole("tab", { name: "Escopos e acessos" }).click();

    await page.getByLabel("Unidade para associar").click();
    await page.getByRole("option", { name: "Rede Norte · Unidade Barra" }).click();
    await page.getByLabel("Papel inicial do acesso").click();
    await page.getByRole("option", { name: "Administrador" }).click();
    await expect(page.getByText("O acesso nasce com papel definido, sem depender de perfil implícito.")).toBeVisible();
    await page.getByRole("button", { name: "Confirmar acesso" }).click();
    await expect(
      page
        .locator('[data-slot="card"]')
        .filter({ hasText: "Unidade Barra" })
        .filter({ hasText: "Papéis ativos nesse escopo" })
        .first()
    ).toBeVisible();

    const barraCard = page
      .locator('[data-slot="card"]')
      .filter({ hasText: "Unidade Barra" })
      .filter({ hasText: "Papéis ativos nesse escopo" })
      .first();
    await expect(barraCard.getByRole("button", { name: /Administrador/ })).toBeVisible();
    await barraCard.getByLabel("Perfil para Unidade Barra").click();
    await page.getByRole("option", { name: "Gerente" }).click();
    await barraCard.getByRole("button", { name: "Atribuir papel" }).click();
    await expect(barraCard.getByRole("button", { name: /Gerente/ })).toBeVisible();

    await barraCard.getByRole("button", { name: "Tornar base operacional" }).click();
    await expect(barraCard.getByText("Base operacional")).toBeVisible();

    await barraCard.getByRole("button", { name: /Administrador/ }).click();
    await expect(barraCard.getByRole("button", { name: /Administrador/ })).not.toBeVisible();
    await expect(barraCard.getByRole("button", { name: /Gerente/ })).toBeVisible();

    await page.getByRole("tab", { name: "Novas unidades" }).click();
    await page.locator('[data-slot="select-trigger"]').filter({ hasText: "Mesma academia" }).click();
    await page.getByRole("option", { name: "Rede inteira" }).click();
    await page.getByRole("button", { name: "Salvar política" }).click();
    await expect(page.getByText("Essa pessoa recebe acesso automático em toda nova unidade da rede.")).toBeVisible();

    await page.goto("/admin/unidades?academiaId=academia-norte");
    await expect(page.getByRole("heading", { name: "Unidades (tenants)" })).toBeVisible();
    await expect(page.getByText("usuário(s) receberão acesso automático nas novas unidades desta academia.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Abrir segurança" }).first()).toBeVisible();

  });

  test("expõe rede, identificadores e distinção entre unidade-base e unidade ativa", async ({ page }) => {
    const state = buildInitialState();
    state.users[0].policy.scope = "REDE";
    state.users[0].memberships.unshift({
      id: "membership-barra-contexto",
      tenantId: "tenant-barra",
      active: true,
      defaultTenant: false,
      accessOrigin: "MANUAL",
      profiles: [{ perfilId: "perfil-gerente-barra" }],
    });

    await seedSession(page, state);
    await setupBackofficeSecurityMocks(page, state);

    await page.goto("/admin/seguranca/usuarios");
    await expect(page.getByRole("heading", { name: "Usuários e acessos" })).toBeVisible();
    const anaRow = page.getByRole("row").filter({ hasText: "Ana Admin" });
    await expect(anaRow.getByText("E-mail: ana.admin@qa.local")).toBeVisible();
    await expect(anaRow.getByText("CPF: ***.***.***-00")).toBeVisible();
    await expect(anaRow.getByText("Escopo efetivo: Rede")).toBeVisible();
    await expect(anaRow.getByText("Base: Unidade Centro · Ativa: Unidade Barra")).toBeVisible();

    await page.goto("/admin/seguranca/usuarios?scopeType=REDE");
    await expect(page.getByText("Redes no recorte:")).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "Ana Admin" })).toBeVisible();

    await page.goto("/admin/seguranca/usuarios/user-ana");
    await expect(page.getByText("Identificadores de login")).toBeVisible();
    await expect(page.getByText("E-mail: ana.admin@qa.local · CPF: ***.***.***-00")).toBeVisible();
    await expect(page.getByText("Leituras gerenciais agregadas")).toBeVisible();
    await page.getByRole("tab", { name: "Escopos e acessos" }).click();
    await expect(page.getByText("Contexto transitório de sessão")).toBeVisible();
  });

  test("cria usuário na segurança global com escopo de rede e memberships iniciais", async ({ page }) => {
    const state = buildInitialState();
    await seedSession(page, state);
    await setupBackofficeSecurityMocks(page, state);

    await page.goto("/admin/seguranca/usuarios");
    await page.getByRole("button", { name: "Novo usuário" }).click();

    await page.getByLabel("Nome completo").fill("Carla Operações");
    await page.getByLabel("E-mail principal").fill("carla@qa.local");
    await page.getByLabel("CPF opcional").fill("111.222.333-44");
    await page.getByLabel("Academia de referência global").click();
    await page.getByRole("option", { name: "Rede Norte" }).click();
    await page.locator("label").filter({ hasText: "Unidade Centro" }).locator("input").check();
    await page.locator("label").filter({ hasText: "Unidade Barra" }).locator("input").check();
    await page.getByLabel("Unidade base global").click();
    await page.getByRole("option", { name: "Unidade Centro" }).click();
    await page.locator("label").filter({ hasText: "Propagar para novas unidades" }).locator("input").check();
    await page.getByLabel("Política inicial global").click();
    await page.getByRole("option", { name: "Rede inteira" }).click();
    await page.getByRole("button", { name: "Criar usuário" }).click();

    await expect(page.getByText("Usuário criado na segurança global.")).toBeVisible();
    const createdRow = page.getByRole("row").filter({ hasText: "Carla Operações" });
    await expect(createdRow).toBeVisible();
    await expect(createdRow.getByText("2 acessos ativos")).toBeVisible();
  });
});
