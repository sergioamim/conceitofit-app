import { expect, test, type Page } from "@playwright/test";
import { installE2EAuthSession } from "./support/auth-session";
import { installProtectedShellMocks } from "./support/protected-shell-mocks";

type IntegrationSeed = {
  integrationKey: "PAYMENTS" | "NFSE" | "CATRACA" | "EVO_IMPORT";
  integrationName: string;
  providerLabel: string;
  status: "ONLINE" | "DEGRADED" | "OFFLINE" | "MAINTENANCE";
  uptimePercent: number;
  avgLatencyMs: number;
  pendingCount: number;
  lastCheckAt: string;
  lastSuccessAt?: string;
  lastErrorMessage?: string;
  lastErrorAt?: string;
  docsHref?: string;
};

type GlobalConfigSeed = {
  emailTemplates: Array<{
    id: string;
    slug: string;
    nome: string;
    assunto: string;
    canal: "EMAIL" | "WHATSAPP" | "SMS";
    ativo: boolean;
    bodyHtml: string;
    variables: string[];
  }>;
  termsOfUseHtml: string;
  termsVersion: string;
  termsUpdatedAt: string;
  apiLimits: {
    requestsPerMinute: number;
    burstLimit: number;
    webhookRequestsPerMinute: number;
    adminRequestsPerMinute: number;
  };
  updatedAt: string;
  updatedBy: string;
};

function seedSession(page: Page) {
  return installE2EAuthSession(page, {
    activeTenantId: "tenant-centro",
    baseTenantId: "tenant-centro",
    availableTenants: [{ tenantId: "tenant-centro", defaultTenant: true }],
    userId: "user-root",
    userKind: "COLABORADOR",
    displayName: "Root Admin",
    roles: ["OWNER", "ADMIN"],
    availableScopes: ["GLOBAL"],
    broadAccess: true,
  });
}

function normalizedPath(path: string) {
  return path.replace(/^\/backend/, "");
}

async function setupMocks(page: Page, state: { integrations: IntegrationSeed[]; globalConfig: GlobalConfigSeed }) {
  await installProtectedShellMocks(page, {
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
    },
    academia: {
      id: "academia-norte",
      nome: "Rede Norte",
      ativo: true,
    },
    capabilities: {
      canAccessElevatedModules: true,
      canDeleteClient: false,
    },
  });

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = normalizedPath(url.pathname);
    const method = request.method();

    if (path === "/api/v1/admin/configuracoes/integracoes/status" && method === "GET") {
      await route.fulfill({
        status: 200,
        json: {
          items: state.integrations,
        },
      });
      return;
    }

    if (path === "/api/v1/admin/configuracoes/global" && method === "GET") {
      await route.fulfill({
        status: 200,
        json: state.globalConfig,
      });
      return;
    }

    if (path === "/api/v1/admin/configuracoes/global" && method === "PUT") {
      const body = request.postDataJSON() as GlobalConfigSeed;
      state.globalConfig = {
        ...state.globalConfig,
        ...body,
        updatedAt: "2026-03-27T15:00:00",
        updatedBy: "Root Admin",
      };
      await route.fulfill({
        status: 200,
        json: state.globalConfig,
      });
      return;
    }

    await route.fallback();
  });
}

test.describe("Backoffice configurações globais", () => {
  test("abre a página e persiste edição de template global", async ({ page }) => {
    const state = {
      integrations: [
        {
          integrationKey: "PAYMENTS" as const,
          integrationName: "Gateway PIX/Boleto",
          providerLabel: "Pagar.me",
          status: "ONLINE" as const,
          uptimePercent: 99.8,
          avgLatencyMs: 132,
          pendingCount: 1,
          lastCheckAt: "2026-03-27T14:58:00",
          lastSuccessAt: "2026-03-27T14:57:45",
          docsHref: "https://docs.qa.local/payments",
        },
        {
          integrationKey: "NFSE" as const,
          integrationName: "NFSe",
          providerLabel: "GINFES",
          status: "DEGRADED" as const,
          uptimePercent: 95.3,
          avgLatencyMs: 680,
          pendingCount: 8,
          lastCheckAt: "2026-03-27T14:58:00",
          lastSuccessAt: "2026-03-27T14:43:00",
          lastErrorMessage: "Lote fiscal com timeout no provedor.",
          lastErrorAt: "2026-03-27T14:52:10",
        },
      ],
      globalConfig: {
        emailTemplates: [
          {
            id: "template-1",
            slug: "boas-vindas",
            nome: "Boas-vindas",
            assunto: "Bem-vindo à plataforma",
            canal: "EMAIL" as const,
            ativo: true,
            bodyHtml: "<p>Olá {{NOME_CLIENTE}}</p>",
            variables: ["{{NOME_CLIENTE}}"],
          },
        ],
        termsOfUseHtml: "<p>Termos vigentes</p>",
        termsVersion: "v2026.03",
        termsUpdatedAt: "2026-03-27T10:00:00",
        apiLimits: {
          requestsPerMinute: 180,
          burstLimit: 260,
          webhookRequestsPerMinute: 120,
          adminRequestsPerMinute: 80,
        },
        updatedAt: "2026-03-27T10:30:00",
        updatedBy: "Root Admin",
      },
    };

    await seedSession(page);
    await setupMocks(page, state);

    await page.goto("/admin/configuracoes");

    await expect(page.getByRole("heading", { name: "Configurações e integrações" })).toBeVisible();
    await expect(page.getByText("Gateway PIX/Boleto")).toBeVisible();
    await expect(page.getByText("NFSe")).toBeVisible();

    await page.getByRole("tab", { name: "Templates" }).click();
    await expect(page.getByLabel("Assunto")).toHaveValue("Bem-vindo à plataforma");

    await page.getByLabel("Assunto").fill("Assunto revisado do backoffice");
    await page.getByRole("button", { name: "Salvar alterações" }).click();

    await expect(page.getByLabel("Assunto")).toHaveValue("Assunto revisado do backoffice");
    await expect.poll(() => state.globalConfig.emailTemplates[0]?.assunto).toBe("Assunto revisado do backoffice");
  });
});
