import { expect, test, type Page, type Request, type Route } from "@playwright/test";
const SESSION_KEYS = [
  "academia-auth-token",
  "academia-auth-refresh-token",
  "academia-auth-token-type",
  "academia-auth-expires-in",
  "academia-auth-active-tenant-id",
  "academia-auth-available-tenants",
];

async function fulfillJson(route: Route, json: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify(json),
  });
}

function getTenantId(request: Request) {
  return new URL(request.url()).searchParams.get("tenantId")?.trim() ?? "";
}

async function mockContasBancariasByTenant(page: Page) {
  const missingTenantRequests: string[] = [];
  const requestedTenantIds: string[] = [];
  const tenants = [
    {
      id: "tenant-s1",
      nome: "MANANCIAIS - S1",
      ativo: true,
    },
    {
      id: "tenant-s3",
      nome: "PECHINCHA - S3",
      ativo: true,
    },
  ];
  let currentTenantId = tenants[0].id;
  let primaryTenantId = "";
  let secondaryTenantId = "";

  await page.route("**/api/v1/context/unidade-ativa**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/backend/, "");

    if (request.method() === "GET" && path === "/api/v1/context/unidade-ativa") {
      const tenantAtual = tenants.find((tenant) => tenant.id === currentTenantId) ?? tenants[0];
      await fulfillJson(route, {
        currentTenantId,
        tenantAtual,
        unidadesDisponiveis: tenants,
      });
      return;
    }

    const match = path.match(/^\/api\/v1\/context\/unidade-ativa\/([^/]+)$/);
    if (request.method() === "PUT" && match) {
      currentTenantId = decodeURIComponent(match[1] ?? "").trim() || currentTenantId;
      const tenantAtual = tenants.find((tenant) => tenant.id === currentTenantId) ?? tenants[0];
      await fulfillJson(route, {
        currentTenantId,
        tenantAtual,
        unidadesDisponiveis: tenants,
      });
      return;
    }

    await fulfillJson(route, { message: `Unhandled ${request.method()} ${path}` }, 404);
  });

  await page.route("**/api/v1/gerencial/financeiro/contas-bancarias**", async (route) => {
    const request = route.request();
    const tenantId = getTenantId(request) || currentTenantId;
    requestedTenantIds.push(tenantId);

    if (!tenantId) {
      missingTenantRequests.push(`${request.method()} ${request.url()}`);
      await fulfillJson(route, { message: "tenantId obrigatório" }, 400);
      return;
    }

    if (!primaryTenantId) {
      primaryTenantId = tenantId;
    } else if (!secondaryTenantId && tenantId !== primaryTenantId) {
      secondaryTenantId = tenantId;
    }

    const isSecondaryTenant = Boolean(secondaryTenantId) && tenantId === secondaryTenantId;
    const payload =
      isSecondaryTenant
        ? [
            {
              id: "conta-s3-001",
              tenantId,
              apelido: "Conta S3 Principal",
              banco: "Banco S3",
              agencia: "3003",
              conta: "300300",
              digito: "3",
              tipo: "CORRENTE",
              titular: "Academia Pechincha",
              pixChave: "s3@academia.local",
              pixTipo: "EMAIL",
              statusCadastro: "ATIVA",
            },
          ]
        : [
            {
              id: "conta-s1-001",
              tenantId,
              apelido: "Conta S1 Principal",
              banco: "Banco S1",
              agencia: "1001",
              conta: "100100",
              digito: "1",
              tipo: "CORRENTE",
              titular: "Academia Mananciais",
              pixChave: "s1@academia.local",
              pixTipo: "EMAIL",
              statusCadastro: "ATIVA",
            },
          ];

    await fulfillJson(route, payload);
  });

  return {
    missingTenantRequests,
    requestedTenantIds,
    get primaryTenantId() {
      return primaryTenantId;
    },
    get secondaryTenantId() {
      return secondaryTenantId;
    },
  };
}

async function loginByUi(page: Page, nextPath = "/dashboard") {
  await page.getByLabel("Usuário").fill("admin@academia.local");
  await page.getByLabel("Senha").fill("12345678");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect
    .poll(() =>
      page.evaluate(() => Boolean(window.localStorage.getItem("academia-auth-token")))
    )
    .toBe(true);

  const saveTenantButton = page.getByRole("button", { name: "Salvar e continuar" });
  if (await saveTenantButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await saveTenantButton.click();
  }

  if (/\/login/.test(page.url())) {
    await page.goto(nextPath);
  }

  await expect(page).not.toHaveURL(/\/login/);
}

test.describe("Sessão e multiunidade", () => {
  test("preserva deep link, troca unidade, mantém contexto no refresh e recupera após perda de sessão", async ({ page }) => {
    const contasMock = await mockContasBancariasByTenant(page);

    await page.goto("/administrativo/contas-bancarias");
    if (/\/login/.test(page.url())) {
      await expect(page).toHaveURL(/\/login\?next=%2Fadministrativo%2Fcontas-bancarias/);
      await expect(page.getByText("Acesso")).toBeVisible();
      await loginByUi(page, "/administrativo/contas-bancarias");
    }

    await expect(page).toHaveURL(/\/administrativo\/contas-bancarias$/);
    await expect(page.getByRole("heading", { name: "Contas bancárias" })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "Conta S1 Principal" })).toBeVisible();

    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "PECHINCHA - S3" }).click();

    await expect(page.getByRole("combobox").first()).toContainText("PECHINCHA - S3");
    await expect(page.getByRole("row").filter({ hasText: "Conta S3 Principal" })).toBeVisible();

    await page.reload();

    await expect(page.getByRole("heading", { name: "Contas bancárias" })).toBeVisible();
    await expect(page.getByRole("combobox").first()).toContainText("PECHINCHA - S3");
    await expect(page.getByRole("row").filter({ hasText: "Conta S3 Principal" })).toBeVisible();

    await page.evaluate((keys) => {
      keys.forEach((key) => window.localStorage.removeItem(key));
    }, SESSION_KEYS);

    await page.reload();
    await page.waitForLoadState("networkidle");

    if (/\/login/.test(page.url())) {
      await expect(page).toHaveURL(/\/login\?next=%2Fadministrativo%2Fcontas-bancarias/);
      await expect(page.getByText("Acesso")).toBeVisible();
    } else {
      await expect(page).toHaveURL(/\/administrativo\/contas-bancarias$/);
      await expect(page.getByRole("heading", { name: "Contas bancárias" })).toBeVisible();
      await expect(page.getByText(/Conta S[13] Principal/)).toBeVisible();
    }

    expect(contasMock.missingTenantRequests).toEqual([]);
  });
});
