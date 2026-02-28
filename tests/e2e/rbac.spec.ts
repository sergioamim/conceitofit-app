import { expect, test, type Page } from "@playwright/test";

type RbacPerfilSeed = {
  id: string;
  tenantId: string;
  roleName: string;
  displayName: string;
  description?: string;
  active: boolean;
};

type RbacUserSeed = {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  active?: boolean;
};

type RbacFeatureSeed = {
  featureKey: string;
  enabled: boolean;
  rollout: number;
};

type RbacGrantSeed = {
  roleName: string;
  featureKey: string;
  permission: "VIEW" | "EDIT" | "MANAGE";
  allowed: boolean;
};

type RbacAuditSeed = {
  id: string;
  tenantId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  actorId?: string;
  actorName?: string;
  actorEmail?: string;
  createdAt: string;
  detalhes?: string;
};

type MockState = {
  tenantId: string;
  perfis: RbacPerfilSeed[];
  users: RbacUserSeed[];
  userPerfis: Record<string, string[]>;
  features: RbacFeatureSeed[];
  grants: RbacGrantSeed[];
  auditoria: RbacAuditSeed[];
};

const seedState = (): MockState => ({
  tenantId: "tenant-1",
  perfis: [
    {
      id: "perfil-admin",
      tenantId: "tenant-1",
      roleName: "ADMIN",
      displayName: "Administrador",
      description: "Perfil principal",
      active: true,
    },
    {
      id: "perfil-atendente",
      tenantId: "tenant-1",
      roleName: "ATENDENTE",
      displayName: "Atendente",
      description: "Operações comerciais",
      active: true,
    },
  ],
  users: [
    {
      id: "user-ana",
      tenantId: "tenant-1",
      name: "Ana Souza",
      email: "ana.souza@academia.local",
      active: true,
    },
  ],
  userPerfis: {
    "user-ana": ["perfil-atendente"],
  },
  features: [
    {
      featureKey: "feature.treinos",
      enabled: true,
      rollout: 100,
    },
    {
      featureKey: "feature.financeiro",
      enabled: false,
      rollout: 20,
    },
  ],
  grants: [
    {
      roleName: "ADMIN",
      featureKey: "feature.treinos",
      permission: "VIEW",
      allowed: true,
    },
  ],
  auditoria: [
    {
      id: "audit-1",
      tenantId: "tenant-1",
      action: "LOGIN",
      resourceType: "auth",
      actorName: "System",
      actorEmail: "system@academia.local",
      createdAt: "2026-02-26T10:00:00",
      detalhes: "Mock inicial de auditoria",
    },
  ],
});

async function openPageAsAuthenticated(page: Page) {
  await page.goto("/login");
  const credentialInputs = page.getByRole("textbox");
  await credentialInputs.nth(0).fill("admin@academia.local");
  await credentialInputs.nth(1).fill("12345678");
  await page.getByRole("button", { name: "Entrar" }).click();

  const unitStep = page.getByRole("heading", { name: "Unidade prioritária" });
  if (await unitStep.isVisible()) {
    await page.getByRole("combobox").click();
    await page.getByRole("option").first().click();
    await page.getByRole("button", { name: /Salvar e continuar/i }).click();
  }

  await page.goto("/seguranca/rbac");
  await expect(page.getByRole("heading", { name: "RBAC" })).toBeVisible();
}

function parseBody<T = unknown>(request: { postData: () => string | null }): T {
  try {
    const raw = request.postData();
    return raw ? (JSON.parse(raw) as T) : ({} as T);
  } catch {
    return {} as T;
  }
}

function pickGrantIndex(state: MockState, payload: { roleName: string; featureKey: string; permission: string }) {
  return state.grants.findIndex(
    (grant) =>
      grant.roleName === payload.roleName &&
      grant.featureKey === payload.featureKey &&
      grant.permission === payload.permission,
  );
}

function toPagination<T>(items: T[], page = 0, size = 20, total = items.length, hasNext = false) {
  return { page, size, hasNext, total, items };
}

function normalizedPath(path: string) {
  return path.replace(/^\/backend/, "");
}

async function setupRbacApiMocks(page: Page, state: MockState) {
  await page.route("**/api/v1/auth/**", async (route) => {
    const request = route.request();
    const method = request.method();
    const path = normalizedPath(new URL(request.url()).pathname);

    if (path === "/api/v1/auth/perfis" && method === "GET") {
      await route.fulfill({ json: toPagination(state.perfis, 0, 20, state.perfis.length), status: 200 });
      return;
    }

    if (path === "/api/v1/auth/perfis" && method === "POST") {
      const payload = parseBody<{
        roleName: string;
        displayName: string;
        description?: string;
        active: boolean;
      }>(request);
      const novo: RbacPerfilSeed = {
        id: `perfil-${Date.now()}`,
        tenantId: state.tenantId,
        roleName: payload.roleName,
        displayName: payload.displayName,
        description: payload.description ?? "",
        active: payload.active,
      };
      state.perfis = [novo, ...state.perfis];
      await route.fulfill({ json: novo, status: 201 });
      return;
    }

    if (/^\/api\/v1\/auth\/perfis\/([^/]+)$/.test(path) && method === "PUT") {
      const roleId = path.split("/").at(-1);
      if (roleId) {
        const payload = parseBody<{
          roleName?: string;
          displayName?: string;
          description?: string;
          active?: boolean;
        }>(request);
        const index = state.perfis.findIndex((perfil) => perfil.id === roleId);
        if (index >= 0) {
          state.perfis[index] = {
            ...state.perfis[index],
            roleName: payload.roleName ?? state.perfis[index].roleName,
            displayName: payload.displayName ?? state.perfis[index].displayName,
            description: payload.description ?? state.perfis[index].description,
            active: payload.active ?? state.perfis[index].active,
          };
        }
        await route.fulfill({ json: state.perfis[index] ?? {}, status: 200 });
        return;
      }
    }

    if (/^\/api\/v1\/auth\/perfis\/([^/]+)$/.test(path) && method === "DELETE") {
      const roleId = path.split("/").at(-1);
      if (roleId) {
        state.perfis = state.perfis.filter((perfil) => perfil.id !== roleId);
      }
      await route.fulfill({ status: 204 });
      return;
    }

    if (path === "/api/v1/auth/users" && method === "GET") {
      await route.fulfill({ json: state.users, status: 200 });
      return;
    }

    if (/^\/api\/v1\/auth\/users\/[^/]+\/perfis$/.test(path) && method === "GET") {
      const userId = path.split("/").at(-2);
      const perfilIds = state.userPerfis[userId ?? ""] ?? [];
      const perfis = state.perfis.filter((perfil) => perfilIds.includes(perfil.id));
      await route.fulfill({ json: perfis, status: 200 });
      return;
    }

    if (/^\/api\/v1\/auth\/users\/[^/]+\/perfis\/[^/]+$/.test(path) && method === "PUT") {
      const parts = path.split("/");
      const userId = parts.at(-2);
      const perfilId = parts.at(-1);
      if (userId && perfilId) {
        const list = state.userPerfis[userId] ?? [];
        if (!list.includes(perfilId)) {
          state.userPerfis[userId] = [...list, perfilId];
        }
      }
      await route.fulfill({ status: 204 });
      return;
    }

    if (/^\/api\/v1\/auth\/users\/[^/]+\/perfis\/[^/]+$/.test(path) && method === "DELETE") {
      const parts = path.split("/");
      const userId = parts.at(-2);
      const perfilId = parts.at(-1);
      if (userId && perfilId) {
        const list = state.userPerfis[userId] ?? [];
        state.userPerfis[userId] = list.filter((item) => item !== perfilId);
      }
      await route.fulfill({ status: 204 });
      return;
    }

    if (path === "/api/v1/auth/features" && method === "GET") {
      await route.fulfill({ json: state.features, status: 200 });
      return;
    }

    if (/^\/api\/v1\/auth\/features\/([^/]+)$/.test(path) && method === "PUT") {
      const rawFeatureKey = decodeURIComponent(path.split("/").at(-1) ?? "");
      const payload = parseBody<{ enabled: boolean; rollout: number }>(request);
      const index = state.features.findIndex((feature) => feature.featureKey === rawFeatureKey);
      if (index >= 0) {
        state.features[index] = {
          ...state.features[index],
          enabled: payload.enabled ?? state.features[index].enabled,
          rollout: payload.rollout ?? state.features[index].rollout,
        };
        await route.fulfill({ json: state.features[index], status: 200 });
        return;
      }
      const saved = {
        featureKey: rawFeatureKey,
        enabled: payload.enabled ?? false,
        rollout: payload.rollout ?? 0,
      } satisfies RbacFeatureSeed;
      state.features = [...state.features, saved];
      await route.fulfill({ json: saved, status: 200 });
      return;
    }

    if (path === "/api/v1/auth/features/grants" && method === "GET") {
      await route.fulfill({ json: state.grants, status: 200 });
      return;
    }

    if (path === "/api/v1/auth/features/grants" && method === "POST") {
      const payload = parseBody<{
        roleName: string;
        featureKey: string;
        permission: "VIEW" | "EDIT" | "MANAGE";
        allowed: boolean;
      }>(request);
      const foundIndex = pickGrantIndex(state, payload);
      if (foundIndex >= 0) {
        state.grants[foundIndex] = {
          ...state.grants[foundIndex],
          allowed: payload.allowed,
          permission: payload.permission,
        };
      } else {
        state.grants = [...state.grants, payload];
      }
      await route.fulfill({ json: state.grants[foundIndex] ?? payload, status: 201 });
      return;
    }

    if (path === "/api/v1/auth/auditoria/permissoes" && method === "GET") {
      const requestUrl = new URL(request.url());
      const action = requestUrl.searchParams.get("action") ?? "";
      const resourceType = requestUrl.searchParams.get("resourceType") ?? "";
      const limit = Number(requestUrl.searchParams.get("limit") ?? "25");
      const filtered = state.auditoria.filter((item) => {
        if (action && item.action !== action) return false;
        if (resourceType && item.resourceType !== resourceType) return false;
        return true;
      });
      await route.fulfill({ json: filtered.slice(0, limit), status: 200 });
      return;
    }

    await route.continue();
  });
}

test.describe("RBAC", () => {
  test("Fluxo principal de perfis, vínculos e grants", async ({ page }) => {
    const state = seedState();
    await setupRbacApiMocks(page, state);
    await openPageAsAuthenticated(page);

    await expect(page.getByRole("button", { name: "Perfis", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Perfis", exact: true }).click();

    await page.getByPlaceholder("ADMIN", { exact: true }).fill("SUPORTE");
    await page.getByPlaceholder("Administrador", { exact: true }).fill("Equipe de Suporte");
    await page.getByPlaceholder("Acesso administrativo completo", { exact: true }).fill("Perfil de suporte para operação");
    await page.getByRole("button", { name: "Salvar perfil" }).click();
    await expect(page.getByText("Perfil criado com sucesso.")).toBeVisible();

    await page.getByRole("button", { name: "Usuário x Perfis" }).click();
    await page.locator('[data-slot="select-trigger"]').filter({ hasText: "Selecionar perfil" }).click();
    await page.locator('[data-slot="select-item"]').filter({ hasText: "Atendente" }).first().click();
    await page.getByRole("button", { name: "Vincular" }).click();
    await expect(page.getByText("Perfil vinculado com sucesso.")).toBeVisible();
    await expect(page.getByRole("cell", { name: "ATENDENTE", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Grants por Feature" }).click();
    await expect(page.getByRole("cell", { name: "feature.treinos" })).toBeVisible();

    await page.getByRole("button", { name: "Auditoria" }).click();
    await expect(page.getByText("LOGIN")).toBeVisible();
  });
});
