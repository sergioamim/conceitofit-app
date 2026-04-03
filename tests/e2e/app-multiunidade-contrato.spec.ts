import { expect, test, type Page, type Request, type Route } from "@playwright/test";
import { installE2EAuthSession } from "./support/auth-session";

const TENANT_A = {
  id: "tenant-contrato-a",
  nome: "Unidade Alpha",
  academiaId: "academia-contrato",
  groupId: "academia-contrato",
  ativo: true,
};

const TENANT_B = {
  id: "tenant-contrato-b",
  nome: "Unidade Beta",
  academiaId: "academia-contrato",
  groupId: "academia-contrato",
  ativo: true,
};

const TENANT_BLOCKED = {
  id: "tenant-contrato-bloqueada",
  nome: "Unidade Bloqueada",
  academiaId: "academia-contrato",
  groupId: "academia-contrato",
  ativo: true,
};

async function fulfillJson(route: Route, json: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify(json),
  });
}

async function seedSession(
  page: Page,
  input: {
    token?: string;
    tenantId?: string;
    availableTenants?: Array<{ tenantId: string; defaultTenant?: boolean }>;
  },
) {
  await installE2EAuthSession(page, {
    token: input.token ?? "token-e2e",
    activeTenantId: input.tenantId,
    preferredTenantId: input.tenantId,
    baseTenantId: input.tenantId,
    availableTenants: input.availableTenants,
    userId: "cliente-1",
    userKind: "CLIENTE",
    displayName: "Cliente Multiunidade",
    availableScopes: ["UNIDADE"],
  });
}

function getTenantId(request: Request): string {
  return new URL(request.url()).searchParams.get("tenantId")?.trim() ?? "";
}

async function installEligibleMultiunitMocks(page: Page) {
  let currentTenantId = TENANT_A.id;

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/backend/, "");
    const method = request.method();

    if (path === "/api/v1/app/bootstrap" && method === "GET") {
      await fulfillJson(route, {
        user: {
          id: "cliente-1",
          nome: "Cliente Multiunidade",
          userKind: "CLIENTE",
          activeTenantId: currentTenantId,
          availableTenants: [
            { tenantId: TENANT_A.id, defaultTenant: true },
            { tenantId: TENANT_B.id, defaultTenant: false },
          ],
          operationalAccess: {
            blocked: false,
            eligibleTenants: [
              { tenantId: TENANT_A.id, tenantNome: TENANT_A.nome, defaultTenant: true },
              { tenantId: TENANT_B.id, tenantNome: TENANT_B.nome, defaultTenant: false },
            ],
            blockedTenants: [
              {
                tenantId: TENANT_BLOCKED.id,
                tenantNome: TENANT_BLOCKED.nome,
                blockedReasons: [{ code: "CONTRACT_BLOCKED", message: "Contrato suspenso na unidade." }],
              },
            ],
          },
        },
        tenantContext: {
          currentTenantId,
          tenantAtual: currentTenantId === TENANT_B.id ? TENANT_B : TENANT_A,
          unidadesDisponiveis: [TENANT_A, TENANT_B],
        },
        academia: {
          id: TENANT_A.academiaId,
          nome: "Academia Contratual",
          ativo: true,
        },
      });
      return;
    }

    if (path === "/api/v1/auth/me" && method === "GET") {
      await fulfillJson(route, {
        id: "cliente-1",
        nome: "Cliente Multiunidade",
        userKind: "CLIENTE",
        activeTenantId: currentTenantId,
        availableTenants: [
          { tenantId: TENANT_A.id, defaultTenant: true },
          { tenantId: TENANT_B.id, defaultTenant: false },
        ],
        operationalAccess: {
          blocked: false,
          eligibleTenants: [
            { tenantId: TENANT_A.id, tenantNome: TENANT_A.nome, defaultTenant: true },
            { tenantId: TENANT_B.id, tenantNome: TENANT_B.nome, defaultTenant: false },
          ],
          blockedTenants: [
            {
              tenantId: TENANT_BLOCKED.id,
              tenantNome: TENANT_BLOCKED.nome,
              blockedReasons: [{ code: "CONTRACT_BLOCKED", message: "Contrato suspenso na unidade." }],
            },
          ],
        },
      });
      return;
    }

    if (path === "/api/v1/context/unidade-ativa" && method === "GET") {
      await fulfillJson(route, {
        currentTenantId,
        tenantAtual: currentTenantId === TENANT_B.id ? TENANT_B : TENANT_A,
        unidadesDisponiveis: [TENANT_A, TENANT_B],
      });
      return;
    }

    const match = path.match(/^\/api\/v1\/context\/unidade-ativa\/([^/]+)$/);
    if (match && method === "PUT") {
      currentTenantId = decodeURIComponent(match[1] ?? "").trim() || currentTenantId;
      await fulfillJson(route, {
        currentTenantId,
        tenantAtual: currentTenantId === TENANT_B.id ? TENANT_B : TENANT_A,
        unidadesDisponiveis: [TENANT_A, TENANT_B],
      });
      return;
    }

    if (path === "/api/v1/comercial/alunos" && method === "GET") {
      const tenantId = getTenantId(request) || currentTenantId;
      await fulfillJson(route, {
        items: [
          {
            id: `aluno-${tenantId}`,
            tenantId,
            nome: tenantId === TENANT_B.id ? "Cliente Unidade Beta" : "Cliente Unidade Alpha",
            email: "cliente@academia.local",
            telefone: "(11) 99999-0000",
            cpf: "11122233344",
            dataNascimento: "1991-01-01",
            sexo: "F",
            status: "ATIVO",
            dataCadastro: "2026-03-01T09:00:00",
          },
        ],
        page: 0,
        size: 20,
        hasNext: false,
        totaisStatus: {
          total: 1,
          totalAtivo: 1,
          totalSuspenso: 0,
          totalInativo: 0,
          totalCancelado: 0,
        },
      });
      return;
    }

    await fulfillJson(route, { message: `Unhandled ${method} ${path}` }, 404);
  });
}

async function installBlockedOperationalMocks(page: Page) {
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/backend/, "");
    const method = request.method();

    if (path === "/api/v1/app/bootstrap" && method === "GET") {
      await fulfillJson(route, {
        user: {
          id: "cliente-bloqueado",
          nome: "Cliente Bloqueado",
          userKind: "CLIENTE",
          operationalAccess: {
            blocked: true,
            message: "Nenhum contrato vigente permite uso operacional nesta rede.",
            eligibleTenants: [],
            blockedTenants: [
              {
                tenantId: TENANT_BLOCKED.id,
                tenantNome: TENANT_BLOCKED.nome,
                blockedReasons: [{ code: "CONTRACT_INACTIVE", message: "Contrato inativo na unidade." }],
              },
            ],
          },
        },
        tenantContext: {
          currentTenantId: TENANT_BLOCKED.id,
          tenantAtual: TENANT_BLOCKED,
          unidadesDisponiveis: [TENANT_BLOCKED],
        },
        academia: {
          id: TENANT_BLOCKED.academiaId,
          nome: "Academia Contratual",
          ativo: true,
        },
      });
      return;
    }

    if (path === "/api/v1/context/unidade-ativa" && method === "GET") {
      await fulfillJson(route, {
        currentTenantId: TENANT_BLOCKED.id,
        tenantAtual: TENANT_BLOCKED,
        unidadesDisponiveis: [TENANT_BLOCKED],
      });
      return;
    }

    if (path === "/api/v1/auth/me" && method === "GET") {
      await fulfillJson(route, {
        id: "cliente-bloqueado",
        nome: "Cliente Bloqueado",
        userKind: "CLIENTE",
        operationalAccess: {
          blocked: true,
          message: "Nenhum contrato vigente permite uso operacional nesta rede.",
          eligibleTenants: [],
          blockedTenants: [
            {
              tenantId: TENANT_BLOCKED.id,
              tenantNome: TENANT_BLOCKED.nome,
              blockedReasons: [{ code: "CONTRACT_INACTIVE", message: "Contrato inativo na unidade." }],
            },
          ],
        },
      });
      return;
    }

    await fulfillJson(route, { message: `Unhandled ${method} ${path}` }, 404);
  });
}

test.describe("App multiunidade orientado por contrato", () => {
  test("permite trocar apenas entre unidades elegíveis e sinaliza bloqueios contratuais", async ({ page }) => {
    await installEligibleMultiunitMocks(page);
    await seedSession(page, {
      tenantId: TENANT_A.id,
      availableTenants: [
        { tenantId: TENANT_A.id, defaultTenant: true },
        { tenantId: TENANT_B.id, defaultTenant: false },
      ],
    });

    await page.goto("/clientes", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Clientes" })).toBeVisible();
    await expect(page.getByText("Cliente Unidade Alpha")).toBeVisible();
    await expect(page.getByText(/Indisponíveis no momento: Unidade Bloqueada: Contrato suspenso na unidade./)).toBeVisible();

    await page.getByRole("combobox", { name: "Selecionar unidade ativa" }).click();
    await page.getByRole("option", { name: TENANT_B.nome }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("combobox", { name: "Selecionar unidade ativa" })).toContainText(TENANT_B.nome);
    await expect(page.getByText(/Indisponíveis no momento: Unidade Bloqueada: Contrato suspenso na unidade./)).toBeVisible();

    await page.waitForLoadState("networkidle");
    await page.goto("/clientes", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Clientes" })).toBeVisible();
    await expect(page.getByText("Cliente Unidade Beta")).toBeVisible();
    await expect(page.getByText("Cliente Unidade Alpha")).toHaveCount(0);
  });

  test("bloqueia a operação quando o cliente autentica sem nenhuma unidade elegível", async ({ page }) => {
    await installBlockedOperationalMocks(page);
    await seedSession(page, {
      tenantId: TENANT_BLOCKED.id,
    });

    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Nenhuma unidade elegível para operação" })).toBeVisible();
    await expect(page.getByText("Nenhum contrato vigente permite uso operacional nesta rede.")).toBeVisible();
    await expect(
      page.getByRole("listitem").filter({ hasText: "Unidade Bloqueada: Contrato inativo na unidade." })
    ).toBeVisible();
  });
});
