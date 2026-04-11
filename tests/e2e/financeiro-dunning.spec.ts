import { expect, test, type Page } from "@playwright/test";
import {
  installGerencialCommonMocks,
  seedGerencialSession,
} from "./support/gerencial-auth";

const TENANT_ID = "tenant-gerencial-e2e";

type IntervencaoMock = {
  alunoId: string;
  matriculaId: string;
  contaReceberId: string;
  valor: number;
  vencimento: string;
  numeroDeFalhas: number;
  ultimoMotivo: string | null;
  dataPrevistaSuspensao: string | null;
  gatewaysDisponiveis: string[];
};

function buildIntervencao(overrides: Partial<IntervencaoMock> = {}): IntervencaoMock {
  return {
    alunoId: "aluno-1",
    matriculaId: "mat-1",
    contaReceberId: "cr-1",
    valor: 199.9,
    vencimento: "2026-04-10",
    numeroDeFalhas: 2,
    ultimoMotivo: "Cartão recusado",
    dataPrevistaSuspensao: "2026-04-25",
    gatewaysDisponiveis: ["PAGARME", "STRIPE"],
    ...overrides,
  };
}

async function installDunningMocks(
  page: Page,
  options: {
    dashboard?: {
      totalAguardandoIntervencao: number;
      totalInadimplente: number;
      valorTotalPendente: number;
      matriculasEmRisco7Dias: number;
      matriculasParaSuspensao: number;
      diasToleranciaConfigurado: number;
    };
    intervencoes: IntervencaoMock[];
    templates?: unknown[];
  },
) {
  const defaultDashboard = {
    totalAguardandoIntervencao: options.intervencoes.length,
    totalInadimplente: options.intervencoes.length,
    valorTotalPendente: options.intervencoes.reduce((acc, i) => acc + i.valor, 0),
    matriculasEmRisco7Dias: 3,
    matriculasParaSuspensao: 1,
    diasToleranciaConfigurado: 5,
  };

  // GET /api/v1/financeiro/dunning/dashboard
  await page.route(
    /\/api\/v1\/financeiro\/dunning\/dashboard/,
    async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(options.dashboard ?? defaultDashboard),
      });
    },
  );

  // GET /api/v1/financeiro/dunning/intervencao (e subpaths)
  await page.route(
    /\/api\/v1\/financeiro\/dunning\/intervencao/,
    async (route) => {
      const method = route.request().method();
      const url = route.request().url();

      if (method === "POST" && /\/intervencao\/[^/?]+\/gerar-link-pagamento/.test(url)) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            sucesso: true,
            link: "https://pix.example/tx999",
            externalId: "tx999",
          }),
        });
      }

      if (method === "POST" && /\/intervencao\/[^/?]+\/regularizar/.test(url)) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ status: "regularizado" }),
        });
      }

      if (method === "GET") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(options.intervencoes),
        });
      }

      await route.fallback();
    },
  );

  // GET /api/v1/financeiro/dunning/templates
  await page.route(
    /\/api\/v1\/financeiro\/dunning\/templates/,
    async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(options.templates ?? []),
      });
    },
  );
}

async function openDunning(page: Page) {
  await installGerencialCommonMocks(page, { tenantId: TENANT_ID });
  await seedGerencialSession(page, { tenantId: TENANT_ID });
  await page.goto("/financeiro/dunning", { waitUntil: "domcontentloaded" });
}

test.describe("Financeiro — Dunning", () => {
  test("cenário 1: renderiza header e métricas do dashboard", async ({
    page,
  }) => {
    await installDunningMocks(page, {
      intervencoes: [buildIntervencao()],
      dashboard: {
        totalAguardandoIntervencao: 5,
        totalInadimplente: 12,
        valorTotalPendente: 2500,
        matriculasEmRisco7Dias: 3,
        matriculasParaSuspensao: 1,
        diasToleranciaConfigurado: 5,
      },
    });
    await openDunning(page);

    await expect(
      page.getByRole("heading", { name: /Cobranca.*Dunning/i }),
    ).toBeVisible();
    await expect(page.getByText("Aguardando intervencao")).toBeVisible();
    await expect(page.getByText("Inadimplentes")).toBeVisible();
    await expect(page.getByText(/R\$\s*2\.500,00/).first()).toBeVisible();
  });

  test("cenário 2: lista intervenções pendentes com valor e motivo", async ({
    page,
  }) => {
    await installDunningMocks(page, {
      intervencoes: [
        buildIntervencao({
          contaReceberId: "cr-1",
          valor: 150,
          ultimoMotivo: "Saldo insuficiente",
          numeroDeFalhas: 3,
        }),
        buildIntervencao({
          contaReceberId: "cr-2",
          alunoId: "aluno-2",
          valor: 299.9,
          ultimoMotivo: "Cartão expirado",
          numeroDeFalhas: 1,
        }),
      ],
    });
    await openDunning(page);

    await expect(
      page.getByRole("heading", { name: /Cobranca.*Dunning/i }),
    ).toBeVisible();
    await expect(page.getByText(/R\$\s*150,00/).first()).toBeVisible();
    await expect(page.getByText(/R\$\s*299,90/).first()).toBeVisible();
  });

  test("cenário 3: métricas com zero intervenções (empty state)", async ({
    page,
  }) => {
    await installDunningMocks(page, {
      intervencoes: [],
      dashboard: {
        totalAguardandoIntervencao: 0,
        totalInadimplente: 0,
        valorTotalPendente: 0,
        matriculasEmRisco7Dias: 0,
        matriculasParaSuspensao: 0,
        diasToleranciaConfigurado: 5,
      },
    });
    await openDunning(page);

    await expect(
      page.getByRole("heading", { name: /Cobranca.*Dunning/i }),
    ).toBeVisible();
    // O valor pendente deve ser R$ 0,00
    await expect(page.getByText(/R\$\s*0,00/).first()).toBeVisible();
  });

  test("cenário 4: cards de tolerância e suspensão aparecem", async ({
    page,
  }) => {
    await installDunningMocks(page, {
      intervencoes: [],
      dashboard: {
        totalAguardandoIntervencao: 0,
        totalInadimplente: 0,
        valorTotalPendente: 0,
        matriculasEmRisco7Dias: 2,
        matriculasParaSuspensao: 4,
        diasToleranciaConfigurado: 7,
      },
    });
    await openDunning(page);

    await expect(page.getByText("Em risco (7 dias)")).toBeVisible();
    await expect(page.getByText("Para suspensao")).toBeVisible();
    await expect(page.getByText(/Tolerancia/)).toBeVisible();
  });

  test("cenário 5: renderiza descrição subtítulo de recuperação de inadimplência", async ({
    page,
  }) => {
    await installDunningMocks(page, { intervencoes: [] });
    await openDunning(page);

    await expect(
      page.getByText(/recuperacao de inadimplencia/, { exact: false }),
    ).toBeVisible();
  });
});
