import { expect, test, type Page, type Request, type Route } from "@playwright/test";

const TENANT_S1 = "550e8400-e29b-41d4-a716-446655440001";
const TENANT_S3 = "550e8400-e29b-41d4-a716-446655440002";
const SESSION_KEY = "academia-mock-logged-in";

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

  await page.route("**/api/v1/gerencial/financeiro/contas-bancarias**", async (route) => {
    const request = route.request();
    const tenantId = getTenantId(request);

    if (!tenantId) {
      missingTenantRequests.push(`${request.method()} ${request.url()}`);
      await fulfillJson(route, { message: "tenantId obrigatório" }, 400);
      return;
    }

    const payload =
      tenantId === TENANT_S3
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

  return { missingTenantRequests };
}

async function loginByUi(page: Page) {
  await page.getByLabel("Usuário").fill("admin@academia.local");
  await page.getByLabel("Senha").fill("12345678");
  await page.getByRole("button", { name: "Entrar" }).click();

  const saveTenantButton = page.getByRole("button", { name: "Salvar e continuar" });
  if (await saveTenantButton.isVisible()) {
    await saveTenantButton.click();
  }
}

test.describe("Sessão e multiunidade", () => {
  test("preserva deep link, troca unidade, mantém contexto no refresh e recupera após perda de sessão", async ({ page }) => {
    const contasMock = await mockContasBancariasByTenant(page);

    await page.goto("/administrativo/contas-bancarias");
    await expect(page).toHaveURL(/\/login\?next=%2Fadministrativo%2Fcontas-bancarias/);
    await expect(page.getByText("Acesso")).toBeVisible();

    await loginByUi(page);

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

    await page.evaluate((key) => {
      window.localStorage.removeItem(key);
    }, SESSION_KEY);

    await page.reload();

    await expect(page).toHaveURL(/\/login\?next=%2Fadministrativo%2Fcontas-bancarias/);
    await expect(page.getByText("Acesso")).toBeVisible();

    await loginByUi(page);

    await expect(page).toHaveURL(/\/administrativo\/contas-bancarias$/);
    await expect(page.getByRole("heading", { name: "Contas bancárias" })).toBeVisible();
    await expect(page.getByText(/Conta S[13] Principal/)).toBeVisible();
    expect(contasMock.missingTenantRequests).toEqual([]);
  });
});
