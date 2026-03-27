import { expect, test, type Page } from "@playwright/test";

type RbacPerfilSeed = {
  id: string;
  tenantId: string;
  roleName: string;
  displayName: string;
  description?: string;
  active: boolean;
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

type AuditSeed = {
  id: string;
  tenantId: string;
  action: string;
  resourceType: string;
  createdAt: string;
  detalhes?: string;
};

type AcademiaSeed = {
  id: string;
  nome: string;
  ativo: boolean;
};

type UnidadeSeed = {
  id: string;
  academiaId: string;
  nome: string;
  ativo: boolean;
};

type FeatureFlagMatrixSeed = {
  featureKey: string;
  globalEnabled: boolean;
  academias: Record<string, boolean>;
};

type State = {
  perfis: RbacPerfilSeed[];
  features: RbacFeatureSeed[];
  grants: RbacGrantSeed[];
  auditoria: AuditSeed[];
  academias: AcademiaSeed[];
  unidades: UnidadeSeed[];
  matrix: FeatureFlagMatrixSeed[];
};

function seedSession(page: Page) {
  return page.addInitScript(() => {
    window.localStorage.setItem("academia-auth-token", "token-security-governance");
    window.localStorage.setItem("academia-auth-refresh-token", "refresh-security-governance");
    window.localStorage.setItem("academia-auth-token-type", "Bearer");
    window.localStorage.setItem("academia-auth-active-tenant-id", "tenant-centro");
    window.localStorage.setItem("academia-auth-preferred-tenant-id", "tenant-centro");
    window.localStorage.setItem(
      "academia-auth-available-tenants",
      JSON.stringify([{ tenantId: "tenant-centro", defaultTenant: true }])
    );
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
    perfis: [
      {
        id: "perfil-admin-centro",
        tenantId: "tenant-centro",
        roleName: "ADMIN",
        displayName: "Administrador",
        description: "Governança operacional ampliada.",
        active: true,
      },
      {
        id: "perfil-gerente-centro",
        tenantId: "tenant-centro",
        roleName: "GERENTE",
        displayName: "Gerente",
        description: "Gestão operacional local.",
        active: true,
      },
    ],
    features: [
      { featureKey: "feature.treinos", enabled: true, rollout: 100 },
      { featureKey: "feature.financeiro", enabled: true, rollout: 20 },
    ],
    grants: [
      { roleName: "ADMIN", featureKey: "feature.treinos", permission: "VIEW", allowed: true },
      { roleName: "ADMIN", featureKey: "feature.financeiro", permission: "MANAGE", allowed: true },
      { roleName: "GERENTE", featureKey: "feature.treinos", permission: "VIEW", allowed: true },
    ],
    auditoria: [
      {
        id: "audit-1",
        tenantId: "tenant-centro",
        action: "UPDATE_PROFILE",
        resourceType: "perfil",
        createdAt: "2026-03-12T10:00:00",
        detalhes: "Administrador revisado para o tenant Centro.",
      },
    ],
    academias: [
      { id: "academia-norte", nome: "Rede Norte", ativo: true },
      { id: "academia-sul", nome: "Rede Sul", ativo: true },
    ],
    unidades: [
      { id: "tenant-centro", academiaId: "academia-norte", nome: "Unidade Centro", ativo: true },
      { id: "tenant-maracana", academiaId: "academia-norte", nome: "Maracanã - S6", ativo: true },
      { id: "tenant-barra", academiaId: "academia-sul", nome: "Barra - S2", ativo: false },
    ],
    matrix: [
      {
        featureKey: "feature.treinos",
        globalEnabled: true,
        academias: {
          "academia-norte": true,
          "academia-sul": true,
        },
      },
      {
        featureKey: "feature.financeiro",
        globalEnabled: true,
        academias: {
          "academia-norte": true,
          "academia-sul": false,
        },
      },
    ],
  };
}

function buildFeatureFlagsMatrixPayload(state: State) {
  return {
    academias: state.academias.map((academia) => {
      const unidades = state.unidades.filter((item) => item.academiaId === academia.id);
      return {
        academiaId: academia.id,
        academiaNome: academia.nome,
        totalUnits: unidades.length,
        activeUnits: unidades.filter((item) => item.ativo).length,
      };
    }),
    features: state.matrix.map((item) => ({
      featureKey: item.featureKey,
      featureLabel: item.featureKey === "feature.financeiro" ? "Gestão financeira" : "Gestão de treinos",
      moduleLabel: item.featureKey === "feature.financeiro" ? "Financeiro" : "Treinos",
      description:
        item.featureKey === "feature.financeiro"
          ? "Capacidade financeira propagada por academia."
          : "Capacidade operacional de treinos propagada por academia.",
      globalEnabled: item.globalEnabled,
      globalSource: "GLOBAL",
      academias: state.academias.map((academia) => {
        const enabled = item.academias[academia.id] ?? item.globalEnabled;
        const unidades = state.unidades.filter((tenant) => tenant.academiaId === academia.id);
        const propagatedUnits = enabled ? unidades.length : 0;
        return {
          academiaId: academia.id,
          academiaNome: academia.nome,
          enabled,
          effectiveEnabled: enabled,
          inheritedFromGlobal: enabled === item.globalEnabled,
          propagationStatus: unidades.length === 0 ? "PENDENTE" : propagatedUnits === unidades.length ? "TOTAL" : "PARCIAL",
          propagatedUnits,
          totalUnits: unidades.length,
        };
      }),
    })),
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
        json: state.academias,
      });
      return;
    }

    if (path === "/api/v1/admin/unidades" && method === "GET") {
      await route.fulfill({
        status: 200,
        json: state.unidades,
      });
      return;
    }

    if (path === "/api/v1/admin/seguranca/usuarios" && method === "GET") {
      await route.fulfill({
        status: 200,
        json: {
          page: 0,
          size: 100,
          total: 2,
          hasNext: false,
          items: [
            {
              id: "user-ana",
              nome: "Ana Admin",
              email: "ana@qa.local",
              status: "ATIVO",
              active: true,
              academias: [{ id: "academia-norte", nome: "Rede Norte" }],
              profiles: [{ displayName: "Administrador" }],
              membershipsAtivos: 2,
              membershipsTotal: 2,
              defaultTenantId: "tenant-centro",
              defaultTenantName: "Unidade Centro",
              eligibleForNewUnits: true,
              broadAccess: true,
              exceptionsCount: 1,
              reviewStatus: "PENDENTE",
            },
            {
              id: "user-bia",
              nome: "Bia Gerente",
              email: "bia@qa.local",
              status: "ATIVO",
              active: true,
              academias: [{ id: "academia-norte", nome: "Rede Norte" }],
              profiles: [{ displayName: "Gerente" }],
              membershipsAtivos: 1,
              membershipsTotal: 1,
              defaultTenantId: "tenant-centro",
              defaultTenantName: "Unidade Centro",
              eligibleForNewUnits: false,
              broadAccess: false,
              exceptionsCount: 0,
              reviewStatus: "EM_DIA",
            },
          ],
        },
      });
      return;
    }

    if (path === "/api/v1/auth/perfis" && method === "GET") {
      await route.fulfill({
        status: 200,
        json: {
          page: 0,
          size: state.perfis.length,
          total: state.perfis.length,
          hasNext: false,
          items: state.perfis,
        },
      });
      return;
    }

    if (path === "/api/v1/auth/perfis" && method === "POST") {
      const payload = parseBody<{ name: string; displayName: string; description?: string }>(request.postData());
      const created = {
        id: `perfil-${state.perfis.length + 1}`,
        tenantId: "tenant-centro",
        roleName: payload.name,
        displayName: payload.displayName,
        description: payload.description,
        active: true,
      } satisfies RbacPerfilSeed;
      state.perfis = [created, ...state.perfis];
      await route.fulfill({ status: 201, json: created });
      return;
    }

    if (/^\/api\/v1\/auth\/perfis\/[^/]+$/.test(path) && method === "PUT") {
      const perfilId = path.split("/").at(-1) ?? "";
      const payload = parseBody<{ displayName?: string; description?: string; active?: boolean }>(request.postData());
      const index = state.perfis.findIndex((perfil) => perfil.id === perfilId);
      if (index >= 0) {
        state.perfis[index] = {
          ...state.perfis[index],
          displayName: payload.displayName ?? state.perfis[index].displayName,
          description: payload.description ?? state.perfis[index].description,
          active: payload.active ?? state.perfis[index].active,
        };
      }
      await route.fulfill({ status: 200, json: state.perfis[index] });
      return;
    }

    if (path === "/api/v1/auth/features" && method === "GET") {
      await route.fulfill({ status: 200, json: state.features });
      return;
    }

    if (/^\/api\/v1\/auth\/features\/[^/]+$/.test(path) && method === "PUT") {
      const featureKey = decodeURIComponent(path.split("/").at(-1) ?? "");
      const payload = parseBody<{ enabled?: boolean; rolloutPercentage?: number }>(request.postData());
      const index = state.features.findIndex((feature) => feature.featureKey === featureKey);
      if (index >= 0) {
        state.features[index] = {
          ...state.features[index],
          enabled: payload.enabled ?? state.features[index].enabled,
          rollout: payload.rolloutPercentage ?? state.features[index].rollout,
        };
      }
      await route.fulfill({ status: 200, json: state.features[index] });
      return;
    }

    if (path === "/api/v1/auth/features/grants" && method === "GET") {
      await route.fulfill({ status: 200, json: state.grants });
      return;
    }

    if (path === "/api/v1/auth/features/grants" && method === "POST") {
      const payload = parseBody<RbacGrantSeed>(request.postData());
      const index = state.grants.findIndex(
        (grant) =>
          grant.roleName === payload.roleName &&
          grant.featureKey === payload.featureKey &&
          grant.permission === payload.permission
      );
      if (index >= 0) {
        state.grants[index] = payload;
      } else {
        state.grants.push(payload);
      }
      await route.fulfill({ status: 201, json: payload });
      return;
    }

    if (path === "/api/v1/auth/auditoria/permissoes" && method === "GET") {
      await route.fulfill({ status: 200, json: state.auditoria });
      return;
    }

    if (path === "/api/v1/admin/configuracoes/feature-flags/matrix" && method === "GET") {
      await route.fulfill({ status: 200, json: buildFeatureFlagsMatrixPayload(state) });
      return;
    }

    if (/^\/api\/v1\/admin\/configuracoes\/feature-flags\/[^/]+\/global$/.test(path) && method === "PATCH") {
      const featureKey = decodeURIComponent(path.split("/")[6] ?? "");
      const payload = parseBody<{ enabled?: boolean }>(request.postData());
      const current = state.matrix.find((item) => item.featureKey === featureKey);
      if (current) {
        current.globalEnabled = payload.enabled ?? current.globalEnabled;
      }
      await route.fulfill({ status: 200, json: buildFeatureFlagsMatrixPayload(state) });
      return;
    }

    if (/^\/api\/v1\/admin\/configuracoes\/feature-flags\/[^/]+\/academias\/[^/]+$/.test(path) && method === "PATCH") {
      const segments = path.split("/");
      const featureKey = decodeURIComponent(segments[6] ?? "");
      const academiaId = segments[8] ?? "";
      const payload = parseBody<{ enabled?: boolean }>(request.postData());
      const current = state.matrix.find((item) => item.featureKey === featureKey);
      if (current) {
        current.academias[academiaId] = payload.enabled ?? current.academias[academiaId] ?? current.globalEnabled;
      }
      await route.fulfill({ status: 200, json: buildFeatureFlagsMatrixPayload(state) });
      return;
    }

    await route.fulfill({ status: 404, json: { message: `Sem stub para ${method} ${path}` } });
  });
}

test.describe("Backoffice segurança governança", () => {
  test("edita perfil padronizado, aplica preview na matriz e salva rollout do catálogo", async ({ page }) => {
    const state = buildState();
    await seedSession(page);
    await setupMocks(page, state);

    await page.goto("/admin/seguranca/perfis");
    await expect(page.getByRole("heading", { name: "Perfis padronizados" })).toBeVisible();

    await page.getByLabel("Nome amigável").fill("Administrador Global");
    await page.getByRole("button", { name: "Salvar perfil" }).click();
    await expect(page.getByText("Administrador Global")).toBeVisible();

    const treinosRow = page.locator("div").filter({ hasText: "Gestão de treinos" }).filter({ hasText: "feature.treinos" }).first();
    await treinosRow.getByRole("button", { name: "Editar" }).first().click();
    await expect(page.getByText("Preview de impacto")).toBeVisible();
    await page.getByRole("button", { name: "Confirmar ajuste" }).click();
    await expect(page.getByText("Preview de impacto")).not.toBeVisible();

    await page.goto("/admin/seguranca/funcionalidades");
    await expect(page.getByRole("heading", { name: "Funcionalidades" })).toBeVisible();

    await page.getByLabel("Buscar").fill("Financeiro");
    await page.locator("button.w-full").filter({ hasText: "Gestão financeira" }).first().click();
    await page.getByLabel("Rollout (%)").fill("35");
    await page.getByRole("button", { name: "Salvar governança" }).click();
    await expect(page.getByText("35%")).toBeVisible();

    const globalFinanceiro = page.getByRole("button", { name: "Override global Gestão financeira" });
    await expect(globalFinanceiro).toContainText("Ligada");
    await globalFinanceiro.click();
    await expect(globalFinanceiro).toContainText("Desligada");

    const norteFinanceiro = page.getByRole("button", { name: "Rede Norte Gestão financeira" });
    await expect(norteFinanceiro).toContainText("Ligada");

    const sulFinanceiro = page.getByRole("button", { name: "Rede Sul Gestão financeira" });
    await expect(sulFinanceiro).toContainText("Desligada");
    await sulFinanceiro.click();
    await expect(sulFinanceiro).toContainText("Ligada");
    await expect(page.getByText("Parcial 0/1")).toHaveCount(0);
  });
});
