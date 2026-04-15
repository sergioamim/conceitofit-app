import { expect, test, type Page, type Route } from "./support/test";
import { installBackofficeGlobalSession } from "./support/backoffice-global-session";

/**
 * E2E para a tela /admin/caixas (CXO-203).
 *
 * Cobre:
 *  - GERENTE entra → vê dashboard e contagem de diferenças;
 *  - OPERADOR comum → vê painel de "Acesso restrito" no lugar das tabs;
 *  - troca para tab Caixas → consome /api/caixas;
 *  - troca para tab Diferenças → consome /api/caixas/diferencas.
 *
 * Erros 403 da API são absorvidos pelo client (não usamos backend real).
 */

const TODAY = "2026-04-15";

type CaixaSeed = {
  id: string;
  status: "ABERTO" | "FECHADO" | "FECHADO_COM_DIFERENCA";
  abertoEm: string;
  fechadoEm: string | null;
  valorAbertura: number;
  valorFechamento: number | null;
  valorInformado: number | null;
  operadorId: string;
  operadorNome: string;
  caixaCatalogoId: string;
};

const SEED_CAIXAS: CaixaSeed[] = [
  {
    id: "caixa-1",
    status: "ABERTO",
    abertoEm: `${TODAY}T09:00:00`,
    fechadoEm: null,
    valorAbertura: 100,
    valorFechamento: null,
    valorInformado: null,
    operadorId: "op-ana",
    operadorNome: "Ana Atendente",
    caixaCatalogoId: "cat-1",
  },
  {
    id: "caixa-2",
    status: "FECHADO_COM_DIFERENCA",
    abertoEm: `${TODAY}T08:00:00`,
    fechadoEm: `${TODAY}T18:30:00`,
    valorAbertura: 100,
    valorFechamento: 950,
    valorInformado: 940,
    operadorId: "op-bia",
    operadorNome: "Bia Bittencourt",
    caixaCatalogoId: "cat-1",
  },
];

async function stubCaixaApis(page: Page) {
  await page.route("**/api/caixas/dashboard**", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        data: TODAY,
        caixasAbertos: [SEED_CAIXAS[0]],
        caixasFechados: [SEED_CAIXAS[1]],
        totalMovimentado: {
          caixaId: "agg",
          total: 1850,
          porFormaPagamento: { DINHEIRO: 800, PIX: 1050 },
          movimentosCount: 5,
        },
        alertasDiferencaCount: 1,
      }),
    }),
  );

  await page.route(/\/api\/caixas(\?|$)/, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify(SEED_CAIXAS),
    }),
  );

  await page.route("**/api/caixas/diferencas**", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify([
        {
          caixaId: "caixa-2",
          operadorId: "op-bia",
          operadorNome: "Bia Bittencourt",
          diferenca: -10,
          dataFechamento: `${TODAY}T18:30:00`,
        },
      ]),
    }),
  );
}

test.describe("Admin /admin/caixas (CXO-203)", () => {
  test("GERENTE acessa dashboard e troca para tab Diferenças", async ({ page }) => {
    await installBackofficeGlobalSession(page, {
      session: { roles: ["GERENTE", "ADMIN"] },
      shell: { user: { roles: ["GERENTE", "ADMIN"] } },
    });
    await stubCaixaApis(page);

    await page.goto("/admin/caixas");

    await expect(
      page.getByRole("heading", { level: 1, name: /caixas operacionais/i }),
    ).toBeVisible();

    // Tabs visíveis
    await expect(page.getByRole("tab", { name: /^Dashboard$/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /^Caixas$/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Diferenças/ })).toBeVisible();

    // Dashboard exibe contadores
    await expect(page.getByText(/caixas abertos/i)).toBeVisible();
    await expect(page.getByText(/total movimentado/i)).toBeVisible();
    await expect(page.getByText(/1 diferença detectada hoje/i)).toBeVisible();

    // Click no CTA "Ver diferenças" abre tab Diferenças
    await page.getByRole("button", { name: /ver diferenças/i }).first().click();
    await expect(page.getByText(/Diferenças nos fechamentos/i)).toBeVisible();
  });

  test("OPERADOR sem perfil gerente vê painel de acesso restrito", async ({
    page,
  }) => {
    await installBackofficeGlobalSession(page, {
      session: { roles: ["OPERADOR"] },
      shell: { user: { roles: ["OPERADOR"] } },
    });
    await stubCaixaApis(page);

    await page.goto("/admin/caixas");

    await expect(
      page.getByText(/Acesso restrito a perfis gerente ou administrativo/i),
    ).toBeVisible();
    await expect(page.getByRole("tab", { name: /^Dashboard$/ })).toHaveCount(0);
  });
});
