import { expect, test, type Page } from "@playwright/test";
import { seedAlunoSession } from "./support/aluno-auth";
import { installAlunoCommonMocks } from "./support/aluno-api-mocks";

const TENANT_ID = "tenant-aluno-e2e";
const USER_ID = "aluno-e2e-1";

type PagamentoMock = {
  id: string;
  alunoId: string;
  descricao: string;
  valor: number;
  desconto: number;
  valorFinal: number;
  status: "PAGO" | "PENDENTE" | "VENCIDO" | "CANCELADO";
  formaPagamento: string;
  dataVencimento: string;
  dataPagamento?: string;
  tenantId: string;
  nfseEmitida?: boolean;
};

type CobrancaMock = {
  id: string;
  descricao: string;
  valor: number;
  vencimento: string;
  status: "ABERTA" | "PAGA" | "VENCIDA" | "CANCELADA";
  formaPagamento: string;
};

function buildPagamento(overrides: Partial<PagamentoMock> = {}): PagamentoMock {
  return {
    id: "pag-1",
    alunoId: USER_ID,
    descricao: "Mensalidade Abril",
    valor: 150,
    desconto: 0,
    valorFinal: 150,
    status: "PAGO",
    formaPagamento: "PIX",
    dataVencimento: "2026-04-10",
    dataPagamento: "2026-04-10",
    tenantId: TENANT_ID,
    nfseEmitida: false,
    ...overrides,
  };
}

function buildCobranca(overrides: Partial<CobrancaMock> = {}): CobrancaMock {
  return {
    id: "cob-1",
    descricao: "Mensalidade Maio",
    valor: 150,
    vencimento: "2026-05-10",
    status: "ABERTA",
    formaPagamento: "PIX",
    ...overrides,
  };
}

async function installMeusPagamentosMocks(
  page: Page,
  options: {
    pagamentos: PagamentoMock[];
    cobrancas: CobrancaMock[];
    detalheCobranca?: CobrancaMock & {
      linkPagamento?: string | null;
      pixCopiaECola?: string | null;
      boletoUrl?: string | null;
    };
    onSegundaVia?: (route: import("@playwright/test").Route) => Promise<void>;
  },
) {
  // GET /api/v1/comercial/pagamentos?alunoId=X
  await page.route(/\/api\/v1\/comercial\/pagamentos(\?|$)/, async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(options.pagamentos),
    });
  });

  // GET /api/v1/app-cliente/cobrancas
  await page.route(/\/api\/v1\/app-cliente\/cobrancas(\?|$)/, async (route) => {
    if (route.request().method() !== "GET") return route.fallback();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(options.cobrancas),
    });
  });

  // GET /api/v1/app-cliente/cobrancas/{id}
  await page.route(
    /\/api\/v1\/app-cliente\/cobrancas\/[^/?]+(\?|$)/,
    async (route) => {
      const method = route.request().method();
      const url = route.request().url();

      // POST /segunda-via
      if (method === "POST" && /\/segunda-via/.test(url)) {
        if (options.onSegundaVia) return options.onSegundaVia(route);
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ link: "https://pix.example/tx123", tipo: "PIX" }),
        });
      }

      if (method !== "GET") return route.fallback();

      const detalhe = options.detalheCobranca ?? {
        ...options.cobrancas[0],
        linkPagamento: null,
        pixCopiaECola: null,
        boletoUrl: null,
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(detalhe),
      });
    },
  );
}

async function openMeusPagamentos(page: Page) {
  await installAlunoCommonMocks(page, { tenantId: TENANT_ID, userId: USER_ID });
  await seedAlunoSession(page, { tenantId: TENANT_ID, userId: USER_ID });
  await page.goto("/meus-pagamentos", { waitUntil: "domcontentloaded" });
}

test.describe("Portal do Aluno — Meus Pagamentos", () => {
  test("cenário 1: exibe summary de totais (pago, pendente, vencido)", async ({
    page,
  }) => {
    await installMeusPagamentosMocks(page, {
      pagamentos: [
        buildPagamento({ id: "p1", status: "PAGO", valorFinal: 150 }),
        buildPagamento({ id: "p2", status: "PAGO", valorFinal: 150 }),
        buildPagamento({
          id: "p3",
          status: "PENDENTE",
          valorFinal: 200,
          dataPagamento: undefined,
        }),
        buildPagamento({
          id: "p4",
          status: "VENCIDO",
          valorFinal: 100,
          dataPagamento: undefined,
        }),
      ],
      cobrancas: [],
    });
    await openMeusPagamentos(page);

    await expect(
      page.getByRole("heading", { name: "Meus Pagamentos" }),
    ).toBeVisible();

    // Total pago = 300, pendente = 200, vencido = 100
    await expect(page.getByText(/R\$\s*300,00/).first()).toBeVisible();
    await expect(page.getByText(/R\$\s*200,00/).first()).toBeVisible();
    await expect(page.getByText(/R\$\s*100,00/).first()).toBeVisible();
  });

  test("cenário 2: lista cobranças abertas na aba Cobrancas", async ({
    page,
  }) => {
    await installMeusPagamentosMocks(page, {
      pagamentos: [],
      cobrancas: [
        buildCobranca({
          id: "cob-1",
          descricao: "Mensalidade Maio",
          status: "ABERTA",
        }),
        buildCobranca({
          id: "cob-2",
          descricao: "Avaliação Física",
          valor: 80,
          status: "ABERTA",
        }),
      ],
    });
    await openMeusPagamentos(page);

    await expect(page.getByText("Mensalidade Maio")).toBeVisible();
    await expect(page.getByText("Avaliação Física")).toBeVisible();
  });

  test("cenário 3: alterna para aba Histórico e mostra pagamentos", async ({
    page,
  }) => {
    await installMeusPagamentosMocks(page, {
      pagamentos: [
        buildPagamento({
          id: "p1",
          descricao: "Mensalidade Março",
          status: "PAGO",
          valorFinal: 175,
          dataPagamento: "2026-03-10",
        }),
      ],
      cobrancas: [],
    });
    await openMeusPagamentos(page);

    // Aguarda sair do loading e garantir que pagamentos[] foi populado
    // (summary renderiza R$ 175,00 no card "Total Pago" quando há dados)
    await expect(
      page.getByRole("heading", { name: "Meus Pagamentos" }),
    ).toBeVisible();
    await expect(page.getByText(/R\$\s*175,00/).first()).toBeVisible();

    await page.getByRole("button", { name: /^Historico$/ }).click();
    await expect(page.getByText("Mensalidade Março")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("cenário 4: abre detalhe da cobrança e mostra PIX copia-e-cola", async ({
    page,
  }) => {
    await installMeusPagamentosMocks(page, {
      pagamentos: [],
      cobrancas: [buildCobranca({ id: "cob-1", descricao: "Mensalidade Maio" })],
      detalheCobranca: {
        id: "cob-1",
        descricao: "Mensalidade Maio",
        valor: 150,
        vencimento: "2026-05-10",
        status: "ABERTA",
        formaPagamento: "PIX",
        linkPagamento: null,
        pixCopiaECola: "00020126580014br.gov.bcb.pix0136e2e-pix-code5204000053039865802BR",
        boletoUrl: null,
      },
    });
    await openMeusPagamentos(page);

    await page.getByText("Mensalidade Maio").click();

    // Na tela de detalhe o título da cobrança aparece novamente
    await expect(page.getByText(/Mensalidade Maio/).first()).toBeVisible();
    await expect(
      page.getByText(/00020126580014br\.gov\.bcb\.pix/, { exact: false }),
    ).toBeVisible();
  });

  test("cenário 5: empty state quando sem cobranças e sem pagamentos", async ({
    page,
  }) => {
    await installMeusPagamentosMocks(page, {
      pagamentos: [],
      cobrancas: [],
    });
    await openMeusPagamentos(page);

    await expect(
      page.getByRole("heading", { name: "Meus Pagamentos" }),
    ).toBeVisible();
    await expect(page.getByText(/Nenhuma cobranca encontrada/i)).toBeVisible();
  });
});
