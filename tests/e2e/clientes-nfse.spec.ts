import { expect, test, type Page, type Route } from "@playwright/test";
import { seedAuthenticatedSession } from "./support/backend-only-stubs";

const TENANT = {
  id: "tenant-clientes-nfse",
  nome: "Unidade Fiscal",
  academiaId: "academia-clientes-nfse",
  groupId: "academia-clientes-nfse",
  ativo: true,
  branding: {
    appName: "Conceito Fit Fiscal",
  },
};

const ALUNO = {
  id: "aluno-nfse-1",
  tenantId: TENANT.id,
  nome: "Marina Fiscal",
  email: "marina.fiscal@academia.local",
  telefone: "(11) 99999-2200",
  cpf: "98765432100",
  dataNascimento: "1991-06-15",
  sexo: "F",
  status: "ATIVO",
  pendenteComplementacao: false,
  dataCadastro: "2026-03-01T09:00:00",
};

const PLANO = {
  id: "plano-nfse-1",
  tenantId: TENANT.id,
  nome: "Plano Premium",
  tipo: "MENSAL",
  duracaoDias: 30,
  valor: 189.9,
  valorMatricula: 29.9,
  ativo: true,
};

const MATRICULA = {
  id: "matricula-nfse-1",
  tenantId: TENANT.id,
  alunoId: ALUNO.id,
  planoId: PLANO.id,
  dataInicio: "2026-03-01",
  dataFim: "2026-03-31",
  valorPago: 189.9,
  valorMatricula: 29.9,
  desconto: 0,
  formaPagamento: "PIX",
  status: "ATIVA",
  renovacaoAutomatica: true,
  dataCriacao: "2026-03-01T09:00:00",
};

const PAGAMENTOS = [
  {
    id: "pagamento-nfse-emitido",
    tenantId: TENANT.id,
    alunoId: ALUNO.id,
    matriculaId: MATRICULA.id,
    tipo: "MENSALIDADE",
    descricao: "Mensalidade março",
    valor: 189.9,
    desconto: 0,
    valorFinal: 189.9,
    dataVencimento: "2026-03-05",
    dataPagamento: "2026-03-05",
    formaPagamento: "PIX",
    status: "PAGO",
    nfseEmitida: true,
    nfseNumero: "NF-2026-001",
    dataEmissaoNfse: "2026-03-05T10:30:00",
    dataCriacao: "2026-03-01T09:00:00",
  },
  {
    id: "pagamento-nfse-pendente",
    tenantId: TENANT.id,
    alunoId: ALUNO.id,
    matriculaId: MATRICULA.id,
    tipo: "MENSALIDADE",
    descricao: "Mensalidade abril",
    valor: 189.9,
    desconto: 0,
    valorFinal: 189.9,
    dataVencimento: "2026-04-05",
    dataPagamento: "2026-04-05",
    formaPagamento: "PIX",
    status: "PAGO",
    nfseEmitida: false,
    dataCriacao: "2026-04-01T09:00:00",
  },
] as const;

async function fulfillJson(route: Route, json: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify(json),
  });
}

async function installClienteNfseMocks(page: Page) {
  let nfseConfiguracaoCalls = 0;

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^\/backend/, "");
    const method = request.method();

    if (path === "/api/v1/app/bootstrap" && method === "GET") {
      await fulfillJson(route, {
        user: {
          id: "user-1",
          nome: "Gestor Fiscal",
          email: "gestor.fiscal@academia.local",
          roles: ["ALTO"],
          activeTenantId: TENANT.id,
          availableTenants: [{ tenantId: TENANT.id, defaultTenant: true }],
        },
        tenantContext: {
          currentTenantId: TENANT.id,
          tenantAtual: TENANT,
          unidadesDisponiveis: [TENANT],
        },
        academia: {
          id: TENANT.academiaId,
          nome: "Academia Fiscal",
          ativo: true,
          branding: TENANT.branding,
        },
        branding: TENANT.branding,
        capabilities: {
          canAccessElevatedModules: true,
          canDeleteClient: true,
        },
      });
      return;
    }

    if (path === "/api/v1/auth/me" && method === "GET") {
      await fulfillJson(route, {
        id: "user-1",
        nome: "Gestor Fiscal",
        email: "gestor.fiscal@academia.local",
        roles: ["ALTO"],
        activeTenantId: TENANT.id,
        availableTenants: [{ tenantId: TENANT.id, defaultTenant: true }],
      });
      return;
    }

    if (path === "/api/v1/context/unidade-ativa" && method === "GET") {
      await fulfillJson(route, {
        currentTenantId: TENANT.id,
        tenantAtual: TENANT,
        unidadesDisponiveis: [TENANT],
      });
      return;
    }

    if (/^\/api\/v1\/context\/unidade-ativa\/[^/]+$/.test(path) && method === "PUT") {
      await fulfillJson(route, {
        currentTenantId: TENANT.id,
        tenantAtual: TENANT,
        unidadesDisponiveis: [TENANT],
      });
      return;
    }

    if (path === "/api/v1/academia" && method === "GET") {
      await fulfillJson(route, {
        id: TENANT.academiaId,
        nome: "Academia Fiscal",
        ativo: true,
        branding: TENANT.branding,
      });
      return;
    }

    if (path === `/api/v1/comercial/alunos/${ALUNO.id}` && method === "GET") {
      await fulfillJson(route, ALUNO);
      return;
    }

    if (
      (path === `/api/v1/comercial/alunos/${ALUNO.id}/adesoes`
        || path === `/api/v1/comercial/alunos/${ALUNO.id}/matriculas`)
      && method === "GET"
    ) {
      await fulfillJson(route, [MATRICULA]);
      return;
    }

    if (path === "/api/v1/comercial/planos" && method === "GET") {
      await fulfillJson(route, [PLANO]);
      return;
    }

    if (path === "/api/v1/comercial/pagamentos" && method === "GET") {
      await fulfillJson(route, PAGAMENTOS);
      return;
    }

    if (path === "/api/v1/gerencial/financeiro/formas-pagamento" && method === "GET") {
      await fulfillJson(route, []);
      return;
    }

    if (path === "/api/v1/administrativo/convenios" && method === "GET") {
      await fulfillJson(route, []);
      return;
    }

    if (path === `/api/v1/comercial/alunos/${ALUNO.id}/presencas` && method === "GET") {
      await fulfillJson(route, []);
      return;
    }

    if (path === "/api/v1/administrativo/nfse/configuracao-atual" && method === "GET") {
      nfseConfiguracaoCalls += 1;
      await fulfillJson(route, {
        status: "ERRO",
        ultimoErro: "Certificado fiscal pendente",
      });
      return;
    }

    await fulfillJson(route, { message: `Unhandled ${method} ${path}` }, 404);
  });

  return {
    getNfseConfiguracaoCalls: () => nfseConfiguracaoCalls,
  };
}

test.describe("Perfil do cliente - aba NFS-e", () => {
  test("carrega configuracao fiscal apenas ao abrir a aba NFS-e", async ({ page }) => {
    const mocks = await installClienteNfseMocks(page);
    await seedAuthenticatedSession(page, {
      tenantId: TENANT.id,
      tenantName: TENANT.nome,
      availableTenants: [{ tenantId: TENANT.id, defaultTenant: true }],
    });

    await page.goto(`/clientes/${ALUNO.id}`);
    await expect(page.getByRole("heading", { name: ALUNO.nome })).toBeVisible();
    await expect.poll(() => mocks.getNfseConfiguracaoCalls()).toBe(0);

    await page.getByRole("button", { name: "NFS-e" }).click();

    await expect(page.getByRole("heading", { name: "NFS-e do cliente" })).toBeVisible();
    await expect.poll(() => mocks.getNfseConfiguracaoCalls()).toBe(1);
    await expect(page.getByText("NF-2026-001")).toBeVisible();
    await expect(page.getByText("Emissão bloqueada")).toBeVisible();
    await expect(page.getByText("Emissão fiscal bloqueada: Certificado fiscal pendente")).toBeVisible();

    await page.getByRole("button", { name: "Dashboard" }).click();
    await page.getByRole("button", { name: "NFS-e" }).click();
    await expect.poll(() => mocks.getNfseConfiguracaoCalls()).toBe(1);
  });
});
