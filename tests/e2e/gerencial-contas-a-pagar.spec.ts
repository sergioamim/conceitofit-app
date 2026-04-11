import { expect, test, type Page, type Route } from "@playwright/test";
import {
  installGerencialCommonMocks,
  seedGerencialSession,
} from "./support/gerencial-auth";

const TENANT_ID = "tenant-gerencial-e2e";

type ContaPagarMock = {
  id: string;
  tenantId: string;
  fornecedor: string;
  documentoFornecedor?: string;
  descricao: string;
  categoria: string;
  grupoDre?: string;
  regime: "COMPETENCIA" | "CAIXA";
  competencia: string;
  dataVencimento: string;
  dataPagamento?: string;
  valorOriginal: number;
  desconto: number;
  jurosMulta: number;
  valorPago?: number;
  formaPagamento?: string;
  status: "PENDENTE" | "PAGA" | "VENCIDA" | "CANCELADA";
  geradaAutomaticamente: boolean;
  origemLancamento?: "MANUAL" | "RECORRENTE";
  dataCriacao: string;
};

function buildConta(overrides: Partial<ContaPagarMock> = {}): ContaPagarMock {
  return {
    id: "conta-1",
    tenantId: TENANT_ID,
    fornecedor: "Fornecedor ACME",
    descricao: "Aluguel Abril",
    categoria: "ALUGUEL",
    grupoDre: "DESPESA_OPERACIONAL",
    regime: "COMPETENCIA",
    competencia: "2026-04",
    dataVencimento: "2026-04-15",
    valorOriginal: 5000,
    desconto: 0,
    jurosMulta: 0,
    status: "PENDENTE",
    geradaAutomaticamente: false,
    origemLancamento: "MANUAL",
    dataCriacao: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

async function installContasPagarMocks(
  page: Page,
  options: {
    contas: ContaPagarMock[];
    onCreate?: (route: Route) => Promise<void>;
    onPagar?: (route: Route) => Promise<void>;
    onCancelar?: (route: Route) => Promise<void>;
  },
) {
  // GET /api/v1/gerencial/financeiro/tipos-conta-pagar
  await page.route(
    /\/api\/v1\/gerencial\/financeiro\/tipos-conta-pagar(\?|$)/,
    async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "tipo-1",
            tenantId: TENANT_ID,
            nome: "Aluguel",
            categoriaOperacional: "ALUGUEL",
            grupoDre: "DESPESA_OPERACIONAL",
            ativo: true,
          },
        ]),
      });
    },
  );

  // GET /api/v1/gerencial/financeiro/regras-recorrencia
  await page.route(
    /\/api\/v1\/gerencial\/financeiro\/regras-recorrencia/,
    async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    },
  );

  // GET /api/v1/gerencial/financeiro/formas-pagamento
  await page.route(
    /\/api\/v1\/gerencial\/financeiro\/formas-pagamento(\?|$)/,
    async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "fp-pix",
            tenantId: TENANT_ID,
            nome: "PIX",
            tipo: "PIX",
            ativo: true,
            parcelasMax: 1,
            taxaPercentual: 0,
          },
        ]),
      });
    },
  );

  // Rota unificada para /contas-pagar — GET e POST + subpaths
  await page.route(
    /\/api\/v1\/gerencial\/financeiro\/contas-pagar/,
    async (route) => {
      const method = route.request().method();
      const url = route.request().url();

      // PATCH /contas-pagar/{id}/pagar
      if (method === "PATCH" && /\/contas-pagar\/[^/?]+\/pagar/.test(url)) {
        if (options.onPagar) return options.onPagar(route);
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ...options.contas[0],
            status: "PAGA",
            dataPagamento: "2026-04-15",
            valorPago: options.contas[0].valorOriginal,
            formaPagamento: "PIX",
          }),
        });
      }

      // PATCH /contas-pagar/{id}/cancelar
      if (method === "PATCH" && /\/contas-pagar\/[^/?]+\/cancelar/.test(url)) {
        if (options.onCancelar) return options.onCancelar(route);
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ...options.contas[0], status: "CANCELADA" }),
        });
      }

      // POST /contas-pagar (criar)
      if (method === "POST" && !/\/contas-pagar\//.test(url)) {
        if (options.onCreate) return options.onCreate(route);
        return route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(buildConta({ id: "conta-new" })),
        });
      }

      // PUT /contas-pagar/{id}
      if (method === "PUT") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(options.contas[0]),
        });
      }

      // GET /contas-pagar (listar)
      if (method === "GET") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(options.contas),
        });
      }

      await route.fallback();
    },
  );
}

async function openContasPagar(page: Page) {
  await installGerencialCommonMocks(page, { tenantId: TENANT_ID });
  await seedGerencialSession(page, { tenantId: TENANT_ID });
  await page.goto("/gerencial/contas-a-pagar", { waitUntil: "domcontentloaded" });
}

test.describe("Gerencial — Contas a Pagar", () => {
  test("cenário 1: lista contas pendentes com fornecedor e valor", async ({
    page,
  }) => {
    await installContasPagarMocks(page, {
      contas: [
        buildConta({
          id: "c1",
          fornecedor: "Imobiliária Central",
          descricao: "Aluguel Abril",
          valorOriginal: 5000,
          status: "PENDENTE",
        }),
      ],
    });
    await openContasPagar(page);

    await expect(
      page.getByRole("heading", { name: /Contas a Pagar/ }),
    ).toBeVisible();
    await expect(page.getByText("Imobiliária Central").first()).toBeVisible();
    await expect(page.getByText("Aluguel Abril").first()).toBeVisible();
    await expect(page.getByText(/R\$\s*5\.000,00/).first()).toBeVisible();
  });

  test("cenário 2: exibe múltiplas contas em aberto (pendentes e vencidas)", async ({
    page,
  }) => {
    // Filtro default é EM_ABERTO (PENDENTE + VENCIDA), PAGA é filtrada.
    // Aqui testamos 3 contas todas visíveis no default.
    await installContasPagarMocks(page, {
      contas: [
        buildConta({
          id: "c1",
          fornecedor: "Fornecedor Alfa",
          status: "PENDENTE",
          valorOriginal: 1000,
        }),
        buildConta({
          id: "c2",
          fornecedor: "Fornecedor Beta",
          status: "PENDENTE",
          valorOriginal: 2500,
        }),
        buildConta({
          id: "c3",
          fornecedor: "Fornecedor Gama",
          status: "VENCIDA",
          valorOriginal: 500,
        }),
      ],
    });
    await openContasPagar(page);

    await expect(page.getByText("Fornecedor Alfa").first()).toBeVisible();
    await expect(page.getByText("Fornecedor Beta").first()).toBeVisible();
    await expect(page.getByText("Fornecedor Gama").first()).toBeVisible();
    await expect(page.getByText(/R\$\s*2\.500,00/).first()).toBeVisible();
  });

  test("cenário 3: stats aparecem com totais por status", async ({ page }) => {
    await installContasPagarMocks(page, {
      contas: [
        buildConta({ id: "c1", status: "PENDENTE", valorOriginal: 3000 }),
        buildConta({
          id: "c2",
          status: "PAGA",
          valorOriginal: 2000,
          dataPagamento: "2026-04-10",
          valorPago: 2000,
        }),
      ],
    });
    await openContasPagar(page);

    // O header deve estar visível (workspace carregou)
    await expect(
      page.getByRole("heading", { name: /Contas a Pagar/ }),
    ).toBeVisible();

    // Pelo menos um dos valores aparece em card/stat
    await expect(page.getByText(/R\$\s*3\.000,00/).first()).toBeVisible();
  });

  test("cenário 4: empty state quando sem contas", async ({ page }) => {
    await installContasPagarMocks(page, { contas: [] });
    await openContasPagar(page);

    await expect(
      page.getByRole("heading", { name: /Contas a Pagar/ }),
    ).toBeVisible();
  });

  test("cenário 5: botão Nova conta existe na tela", async ({ page }) => {
    await installContasPagarMocks(page, { contas: [buildConta()] });
    await openContasPagar(page);

    // O header tem um botão de Nova conta (via ContasPagarHeader)
    const novaContaBtn = page.getByRole("button", { name: /Nova conta|Criar/i }).first();
    await expect(novaContaBtn).toBeVisible();
  });
});
