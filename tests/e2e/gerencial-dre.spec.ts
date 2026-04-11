import { expect, test, type Page } from "@playwright/test";
import {
  installGerencialCommonMocks,
  seedGerencialSession,
} from "./support/gerencial-auth";

const TENANT_ID = "tenant-gerencial-e2e";

type DreMock = {
  periodoInicio: string;
  periodoFim: string;
  receitaBruta: number;
  deducoesReceita: number;
  receitaLiquida: number;
  custosVariaveis: number;
  margemContribuicao: number;
  despesasOperacionais: number;
  ebitda: number;
  resultadoLiquido: number;
  ticketMedio: number;
  inadimplencia: number;
  contasReceberEmAberto: number;
  contasPagarEmAberto: number;
  despesasPorGrupo: Array<{ grupo: string; valor: number }>;
  despesasPorCategoria: Array<{ categoria: string; valor: number }>;
  despesasSemTipoCount: number;
  despesasSemTipoValor: number;
};

function buildDre(overrides: Partial<DreMock> = {}): DreMock {
  return {
    periodoInicio: "2026-04-01",
    periodoFim: "2026-04-30",
    receitaBruta: 50000,
    deducoesReceita: 2000,
    receitaLiquida: 48000,
    custosVariaveis: 10000,
    margemContribuicao: 38000,
    despesasOperacionais: 20000,
    ebitda: 18000,
    resultadoLiquido: 15000,
    ticketMedio: 199,
    inadimplencia: 500,
    contasReceberEmAberto: 1200,
    contasPagarEmAberto: 800,
    despesasPorGrupo: [
      { grupo: "DESPESA_OPERACIONAL", valor: 20000 },
      { grupo: "CUSTO_VARIAVEL", valor: 10000 },
    ],
    despesasPorCategoria: [
      { categoria: "FOLHA", valor: 12000 },
      { categoria: "ALUGUEL", valor: 5000 },
    ],
    despesasSemTipoCount: 0,
    despesasSemTipoValor: 0,
    ...overrides,
  };
}

type DreProjecaoMock = {
  periodoInicio: string;
  periodoFim: string;
  cenario: "BASE" | "OTIMISTA" | "CONSERVADOR";
  realizado: {
    receitas: number;
    despesas: number;
    resultado: number;
    custosVariaveis: number;
    despesasOperacionais: number;
    despesasFinanceiras: number;
    impostos: number;
  };
  projetado: DreProjecaoMock["realizado"];
  consolidado: DreProjecaoMock["realizado"];
  linhas: Array<{
    grupo: string;
    natureza: "RECEITA" | "DESPESA";
    realizado: number;
    projetado: number;
    consolidado: number;
  }>;
};

function buildDreProjecao(
  cenario: "BASE" | "OTIMISTA" | "CONSERVADOR" = "BASE",
): DreProjecaoMock {
  const base = {
    receitas: 48000,
    despesas: 30000,
    resultado: 18000,
    custosVariaveis: 10000,
    despesasOperacionais: 20000,
    despesasFinanceiras: 0,
    impostos: 0,
  };
  return {
    periodoInicio: "2026-04-01",
    periodoFim: "2026-07-31",
    cenario,
    realizado: base,
    projetado: { ...base, receitas: 144000, despesas: 90000, resultado: 54000 },
    consolidado: {
      ...base,
      receitas: 192000,
      despesas: 120000,
      resultado: 72000,
    },
    linhas: [
      {
        grupo: "Receita de serviços",
        natureza: "RECEITA",
        realizado: 48000,
        projetado: 144000,
        consolidado: 192000,
      },
      {
        grupo: "Folha",
        natureza: "DESPESA",
        realizado: 12000,
        projetado: 36000,
        consolidado: 48000,
      },
    ],
  };
}

async function installDreMocks(
  page: Page,
  options: {
    dre?: DreMock | null;
    projecao?: DreProjecaoMock;
    onDreError?: number;
  } = {},
) {
  // GET /api/v1/gerencial/financeiro/dre
  await page.route(
    /\/api\/v1\/gerencial\/financeiro\/dre(\?|$)/,
    async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      if (options.onDreError) {
        return route.fulfill({
          status: options.onDreError,
          contentType: "application/json",
          body: JSON.stringify({ message: "erro simulado" }),
        });
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(options.dre ?? buildDre()),
      });
    },
  );

  // GET /api/v1/gerencial/financeiro/dre/projecao
  await page.route(
    /\/api\/v1\/gerencial\/financeiro\/dre\/projecao/,
    async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(options.projecao ?? buildDreProjecao()),
      });
    },
  );
}

async function openDre(page: Page) {
  await installGerencialCommonMocks(page, { tenantId: TENANT_ID });
  await seedGerencialSession(page, { tenantId: TENANT_ID });
  await page.goto("/gerencial/dre", { waitUntil: "domcontentloaded" });
}

test.describe("Gerencial — DRE", () => {
  test("cenário 1: renderiza cards de receita, margem, EBITDA e resultado", async ({
    page,
  }) => {
    await installDreMocks(page, { dre: buildDre() });
    await openDre(page);

    await expect(
      page.getByRole("heading", { name: "DRE Gerencial" }),
    ).toBeVisible();

    // Receita líquida = 48.000
    await expect(page.getByText(/R\$\s*48\.000,00/).first()).toBeVisible();
    // Margem contribuição = 38.000
    await expect(page.getByText(/R\$\s*38\.000,00/).first()).toBeVisible();
    // EBITDA = 18.000
    await expect(page.getByText(/R\$\s*18\.000,00/).first()).toBeVisible();
    // Resultado líquido = 15.000
    await expect(page.getByText(/R\$\s*15\.000,00/).first()).toBeVisible();
  });

  test("cenário 2: tabela estrutura DRE mostra receita bruta, deduções e EBITDA", async ({
    page,
  }) => {
    await installDreMocks(page, { dre: buildDre() });
    await openDre(page);

    await expect(page.getByText("Receita bruta")).toBeVisible();
    await expect(page.getByText("(-) Deduções da receita")).toBeVisible();
    await expect(page.getByText("(-) Custos variáveis")).toBeVisible();
    await expect(page.getByText("(-) Despesas operacionais")).toBeVisible();
    await expect(page.getByText("= EBITDA")).toBeVisible();
    await expect(page.getByText("= Resultado líquido").first()).toBeVisible();
  });

  test("cenário 3: seção de projeção aparece com valores realizado/projetado", async ({
    page,
  }) => {
    await installDreMocks(page, {
      dre: buildDre(),
      projecao: buildDreProjecao("BASE"),
    });
    await openDre(page);

    await expect(page.getByText(/Projeção/i).first()).toBeVisible();
    // Realizado 48.000 já aparece na parte superior; projetado 144.000 deve ser novo
    await expect(page.getByText(/R\$\s*144\.000,00/).first()).toBeVisible();
  });

  test("cenário 4: resultado líquido negativo renderiza na cor de perigo", async ({
    page,
  }) => {
    await installDreMocks(page, {
      dre: buildDre({ resultadoLiquido: -5000, ebitda: -3000 }),
    });
    await openDre(page);

    // O valor negativo é mostrado com formato -R$ 5.000,00 (pt-BR)
    await expect(page.getByText(/-R\$\s*5\.000,00/).first()).toBeVisible();
  });

  test("cenário 5: exibe período personalizado quando checkbox marcado", async ({
    page,
  }) => {
    await installDreMocks(page, { dre: buildDre() });
    await openDre(page);

    await expect(
      page.getByRole("heading", { name: "DRE Gerencial" }),
    ).toBeVisible();

    const checkbox = page.getByRole("checkbox", {
      name: /Período personalizado/,
    });
    await checkbox.check();

    // Quando marcado, aparecem dois inputs de data
    const dateInputs = page.locator('input[type="date"]');
    await expect(dateInputs).toHaveCount(2);
  });
});
