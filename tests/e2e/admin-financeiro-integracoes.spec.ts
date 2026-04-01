import { expect, test, type Page, type Request, type Route } from "@playwright/test";
import { installAdminCrudApiMocks, seedAuthenticatedSession } from "./support/backend-only-stubs";
import { installOperationalAppShellMocks } from "./support/protected-shell-mocks";

type TenantContextSeed = {
  currentTenantId: string;
  tenantAtual: {
    id: string;
    nome: string;
    ativo: boolean;
  };
  unidadesDisponiveis: Array<{
    id: string;
    nome: string;
    ativo: boolean;
  }>;
};

type NfseSeed = {
  id: string;
  tenantId: string;
  ambiente: "HOMOLOGACAO" | "PRODUCAO";
  provedor: "GINFES" | "ABRASF" | "BETHA" | "ISSNET" | "IPM";
  prefeitura: string;
  inscricaoMunicipal: string;
  cnaePrincipal: string;
  codigoTributacaoNacional: string;
  codigoNbs: string;
  classificacaoTributaria: "SERVICO_TRIBUTAVEL" | "RETENCAO" | "ISENTO" | "IMUNE" | "NAO_INCIDENTE";
  consumidorFinal: boolean;
  indicadorOperacao: "SERVICO_MUNICIPIO" | "SERVICO_FORA_MUNICIPIO" | "EXPORTACAO";
  serieRps: string;
  loteInicial: number;
  aliquotaPadrao: number;
  regimeTributario: "SIMPLES_NACIONAL" | "LUCRO_PRESUMIDO" | "LUCRO_REAL";
  emissaoAutomatica: boolean;
  webhookFiscalUrl?: string;
  status: "PENDENTE" | "CONFIGURADA" | "ERRO";
  ultimaValidacaoEm?: string;
  ultimaSincronizacaoEm?: string;
  ultimoErro?: string;
};

type ContaReceberSeed = {
  id: string;
  tenantId: string;
  cliente: string;
  documentoCliente?: string;
  descricao: string;
  categoria: "AVULSO" | "SERVICO" | "MATRICULA" | "MENSALIDADE" | "PRODUTO";
  competencia: string;
  dataEmissao?: string;
  dataVencimento: string;
  dataRecebimento?: string;
  valorOriginal: number;
  desconto: number;
  jurosMulta: number;
  formaPagamento?: "PIX" | "DINHEIRO" | "CARTAO_CREDITO" | "CARTAO_DEBITO" | "BOLETO" | "RECORRENTE";
  status: "PENDENTE" | "RECEBIDA" | "VENCIDA" | "CANCELADA";
  observacoes?: string;
  dataCriacao: string;
  nfseEmitida?: boolean;
  nfseNumero?: string;
  dataEmissaoNfse?: string;
};

type AgregadorSeed = {
  id: string;
  tenantId: string;
  pagamentoId?: string;
  adquirente: "STONE" | "CIELO" | "REDE" | "GETNET" | "PAGARME_POS" | "OUTROS";
  nsu: string;
  bandeira: string;
  meioCaptura: "POS" | "TEF" | "LINK_PAGAMENTO";
  clienteNome: string;
  descricao: string;
  valorBruto: number;
  taxa: number;
  valorLiquido: number;
  parcelas: number;
  dataTransacao: string;
  dataPrevistaRepasse: string;
  statusTransacao: "CAPTURADA" | "PENDENTE" | "FALHA" | "ESTORNADA";
  statusRepasse: "PREVISTO" | "EM_TRANSITO" | "LIQUIDADO" | "DIVERGENTE";
  statusConciliacao: "PENDENTE" | "CONCILIADA" | "DIVERGENTE";
};

type IntegracaoSeed = {
  id: string;
  tenantId: string;
  nome: string;
  tipo: "NFSE" | "ADQUIRENTE" | "CATRACA" | "WEBHOOK" | "IMPORTACAO";
  fornecedor: string;
  status: "SAUDAVEL" | "ATENCAO" | "FALHA" | "CONFIGURACAO_PENDENTE";
  filaPendente: number;
  ultimaExecucaoEm?: string;
  ultimaSucessoEm?: string;
  ultimoErro?: string;
  linkDestino?: string;
  ocorrencias: Array<{
    id: string;
    integracaoId: string;
    severidade: "INFO" | "WARN" | "ERROR";
    mensagem: string;
    dataCriacao: string;
  }>;
};

function normalizePath(pathname: string) {
  return pathname.replace(/^\/backend/, "");
}

function getTenantId(request: Request) {
  return new URL(request.url()).searchParams.get("tenantId")?.trim() ?? "";
}

function parseBody<T = unknown>(request: Request): T {
  try {
    const raw = request.postData();
    return raw ? (JSON.parse(raw) as T) : ({} as T);
  } catch {
    return {} as T;
  }
}

async function fulfillJson(route: Route, json: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify(json),
  });
}

async function installAdminFinanceiroApi(page: Page) {
  await installAdminCrudApiMocks(page);
  await installOperationalAppShellMocks(page, {
    currentTenantId: "tenant-1",
    tenants: [
      {
        id: "tenant-1",
        nome: "Unidade Centro",
        ativo: true,
        academiaId: "academia-e2e",
        groupId: "academia-e2e",
      },
    ],
    user: {
      id: "user-admin-financeiro",
      userId: "user-admin-financeiro",
      nome: "Admin Financeiro",
      displayName: "Admin Financeiro",
      email: "financeiro@academia.local",
      roles: ["OWNER", "ADMIN"],
      activeTenantId: "tenant-1",
      availableTenants: [{ tenantId: "tenant-1", defaultTenant: true }],
      availableScopes: ["UNIDADE"],
      broadAccess: false,
      redeId: "academia-e2e",
      redeNome: "Academia E2E",
      redeSlug: "academia-e2e",
    },
    academia: {
      id: "academia-e2e",
      nome: "Academia E2E",
      ativo: true,
    },
    capabilities: {
      canAccessElevatedModules: true,
      canDeleteClient: false,
    },
  });

  const tenantContext: TenantContextSeed = {
    currentTenantId: "tenant-1",
    tenantAtual: {
      id: "tenant-1",
      nome: "Unidade Centro",
      ativo: true,
    },
    unidadesDisponiveis: [
      {
        id: "tenant-1",
        nome: "Unidade Centro",
        ativo: true,
      },
    ],
  };

  let nfse: NfseSeed = {
    id: "nfse-tenant-1",
    tenantId: "tenant-1",
    ambiente: "HOMOLOGACAO",
    provedor: "GINFES",
    prefeitura: "Rio de Janeiro",
    inscricaoMunicipal: "12345",
    cnaePrincipal: "9313-1/00",
    codigoTributacaoNacional: "1301",
    codigoNbs: "1.1301.25.00",
    classificacaoTributaria: "SERVICO_TRIBUTAVEL",
    consumidorFinal: true,
    indicadorOperacao: "SERVICO_MUNICIPIO",
    serieRps: "S1",
    loteInicial: 1,
    aliquotaPadrao: 2,
    regimeTributario: "SIMPLES_NACIONAL",
    emissaoAutomatica: true,
    webhookFiscalUrl: "https://hooks.example.test/fiscal",
    status: "CONFIGURADA",
  };

  let contasReceber: ContaReceberSeed[] = [
    {
      id: "cr-1",
      tenantId: "tenant-1",
      cliente: "Cliente Mensal",
      descricao: "Mensalidade Março",
      categoria: "MENSALIDADE",
      competencia: "2026-03-01",
      dataEmissao: "2026-03-01",
      dataVencimento: "2026-03-10",
      dataRecebimento: "2026-03-10",
      valorOriginal: 199,
      desconto: 0,
      jurosMulta: 0,
      formaPagamento: "PIX",
      status: "RECEBIDA",
      dataCriacao: "2026-03-01T10:00:00",
      nfseEmitida: false,
    },
  ];

  let agregadores: AgregadorSeed[] = [
    {
      id: "agt-984",
      tenantId: "tenant-1",
      pagamentoId: "cr-1",
      adquirente: "STONE",
      nsu: "000984",
      bandeira: "Visa",
      meioCaptura: "POS",
      clienteNome: "Cliente Mensal",
      descricao: "Mensalidade Março",
      valorBruto: 199,
      taxa: 5,
      valorLiquido: 194,
      parcelas: 1,
      dataTransacao: "2026-03-10T10:00:00",
      dataPrevistaRepasse: "2026-03-11",
      statusTransacao: "CAPTURADA",
      statusRepasse: "DIVERGENTE",
      statusConciliacao: "DIVERGENTE",
    },
  ];

  let integracoes: IntegracaoSeed[] = [
    {
      id: "int-webhook",
      tenantId: "tenant-1",
      nome: "Webhook comercial",
      tipo: "WEBHOOK",
      fornecedor: "Hub integrador",
      status: "FALHA",
      filaPendente: 4,
      ultimoErro: "Fila travada",
      ocorrencias: [
        {
          id: "occ-1",
          integracaoId: "int-webhook",
          severidade: "ERROR",
          mensagem: "Timeout na última entrega",
          dataCriacao: "2026-03-10T11:00:00",
        },
      ],
    },
    {
      id: "int-nfse",
      tenantId: "tenant-1",
      nome: "NFSe prefeitura",
      tipo: "NFSE",
      fornecedor: "GINFES",
      status: "CONFIGURACAO_PENDENTE",
      filaPendente: 0,
      ocorrencias: [],
    } as IntegracaoSeed,
  ];

  await page.route("**/api/v1/context/unidade-ativa**", async (route) => {
    const request = route.request();
    const path = normalizePath(new URL(request.url()).pathname);
    if (request.method() === "GET" && path === "/api/v1/context/unidade-ativa") {
      await fulfillJson(route, tenantContext);
      return;
    }
    await fulfillJson(route, { message: `Unhandled ${request.method()} ${path}` }, 404);
  });

  await page.route("**/api/v1/comercial/alunos**", async (route) => {
    const request = route.request();
    const path = normalizePath(new URL(request.url()).pathname);
    if (request.method() === "GET" && path === "/api/v1/comercial/alunos") {
      await fulfillJson(route, {
        items: [
          {
            id: "al-1",
            tenantId: "tenant-1",
            nome: "Cliente Mensal",
            cpf: "11987654321",
            status: "ATIVO",
          },
        ],
      });
      return;
    }
    await fulfillJson(route, { message: `Unhandled ${request.method()} ${path}` }, 404);
  });

  await page.route("**/api/v1/administrativo/nfse/configuracao-atual**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = normalizePath(url.pathname);
    const method = request.method();
    const tenantId = getTenantId(request) || tenantContext.currentTenantId;

    if (tenantId !== "tenant-1") {
      await fulfillJson(route, { message: "tenantId obrigatório" }, 400);
      return;
    }

    if (path === "/api/v1/administrativo/nfse/configuracao-atual" && method === "GET") {
      await fulfillJson(route, nfse);
      return;
    }

    if (path === "/api/v1/administrativo/nfse/configuracao-atual" && method === "PUT") {
      const payload = parseBody<Partial<NfseSeed>>(request);
      nfse = {
        ...nfse,
        ...payload,
        status: "PENDENTE",
        ultimaSincronizacaoEm: "2026-03-12T10:00:00",
      };
      integracoes = integracoes.map((item) =>
        item.id === "int-nfse"
          ? {
              ...item,
              fornecedor: nfse.provedor,
              status: "CONFIGURACAO_PENDENTE",
            }
          : item
      );
      await fulfillJson(route, nfse);
      return;
    }

    await fulfillJson(route, { message: `Unhandled ${method} ${path}` }, 404);
  });

  await page.route("**/api/v1/administrativo/nfse/configuracao-atual/validar**", async (route) => {
    const request = route.request();
    const path = normalizePath(new URL(request.url()).pathname);
    if (request.method() !== "POST" || path !== "/api/v1/administrativo/nfse/configuracao-atual/validar") {
      await fulfillJson(route, { message: `Unhandled ${request.method()} ${path}` }, 404);
      return;
    }

    nfse = {
      ...nfse,
      status: "CONFIGURADA",
      ultimaValidacaoEm: "2026-03-12T10:05:00",
      ultimaSincronizacaoEm: "2026-03-12T10:05:00",
      ultimoErro: undefined,
    };
    integracoes = integracoes.map((item) =>
      item.id === "int-nfse"
        ? {
            ...item,
            fornecedor: nfse.provedor,
            status: "SAUDAVEL",
            ultimaExecucaoEm: "2026-03-12T10:05:00",
            ultimaSucessoEm: "2026-03-12T10:05:00",
          }
        : item
    );
    await fulfillJson(route, nfse);
  });

  await page.route("**/api/v1/comercial/pagamentos/nfse/lote**", async (route) => {
    const request = route.request();
    const path = normalizePath(new URL(request.url()).pathname);
    if (request.method() !== "POST" || path !== "/api/v1/comercial/pagamentos/nfse/lote") {
      await fulfillJson(route, { message: `Unhandled ${request.method()} ${path}` }, 404);
      return;
    }

    if (nfse.status !== "CONFIGURADA") {
      await fulfillJson(
        route,
        {
          message: "Emissão em lote bloqueada porque a configuração fiscal da unidade está incompleta.",
          fieldErrors: {
            codigoTributacaoNacional: "Informe o código de tributação nacional antes de emitir NFSe.",
          },
        },
        422
      );
      return;
    }

    const payload = parseBody<{ ids?: string[] }>(request);
    const ids = Array.isArray(payload.ids) ? payload.ids : [];
    contasReceber = contasReceber.map((item) =>
      ids.includes(item.id)
        ? {
            ...item,
            nfseEmitida: true,
            nfseNumero: `NFS-${item.id.toUpperCase()}`,
            dataEmissaoNfse: "2026-03-12",
          }
        : item
    );
    await fulfillJson(route, contasReceber.filter((item) => ids.includes(item.id)));
  });

  await page.route("**/api/v1/gerencial/financeiro/contas-receber**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = normalizePath(url.pathname);
    const method = request.method();
    const tenantId = getTenantId(request) || tenantContext.currentTenantId;

    if (tenantId !== "tenant-1") {
      await fulfillJson(route, { message: "tenantId obrigatório" }, 400);
      return;
    }

    if (path === "/api/v1/gerencial/financeiro/contas-receber" && method === "GET") {
      await fulfillJson(route, contasReceber);
      return;
    }

    if (path === "/api/v1/gerencial/financeiro/contas-receber" && method === "POST") {
      const payload = parseBody<Partial<ContaReceberSeed>>(request);
      const created: ContaReceberSeed = {
        id: `cr-${contasReceber.length + 1}`,
        tenantId,
        cliente: payload.cliente ?? "Cliente Avulso QA",
        documentoCliente: payload.documentoCliente,
        descricao: payload.descricao ?? "Recebimento avulso",
        categoria: payload.categoria ?? "AVULSO",
        competencia: payload.competencia ?? "2026-03-01",
        dataEmissao: payload.dataEmissao ?? "2026-03-12",
        dataVencimento: payload.dataVencimento ?? "2026-03-12",
        valorOriginal: Number(payload.valorOriginal ?? 0),
        desconto: Number(payload.desconto ?? 0),
        jurosMulta: Number(payload.jurosMulta ?? 0),
        status: "PENDENTE",
        observacoes: payload.observacoes,
        dataCriacao: "2026-03-12T10:10:00",
      };
      contasReceber = [created, ...contasReceber];
      await fulfillJson(route, created, 201);
      return;
    }

    await fulfillJson(route, { message: `Unhandled ${method} ${path}` }, 404);
  });

  await page.route("**/api/v1/gerencial/financeiro/contas-receber/*/receber**", async (route) => {
    const request = route.request();
    const path = normalizePath(new URL(request.url()).pathname);
    const contaId = path.split("/").at(-2) ?? "";
    const payload = parseBody<{ dataRecebimento?: string; formaPagamento?: ContaReceberSeed["formaPagamento"] }>(request);
    contasReceber = contasReceber.map((item) =>
      item.id === contaId
        ? {
            ...item,
            status: "RECEBIDA",
            dataRecebimento: payload.dataRecebimento ?? "2026-03-12",
            formaPagamento: payload.formaPagamento ?? "PIX",
          }
        : item
    );
    await fulfillJson(route, contasReceber.find((item) => item.id === contaId) ?? {}, 200);
  });

  await page.route("**/api/v1/comercial/pagamentos/*/nfse**", async (route) => {
    const request = route.request();
    const path = normalizePath(new URL(request.url()).pathname);
    const pagamentoId = path.split("/").at(-2) ?? "";
    if (nfse.status !== "CONFIGURADA") {
      await fulfillJson(
        route,
        {
          message: "Emissão fiscal bloqueada porque a configuração tributária da unidade está incompleta.",
          fieldErrors: {
            codigoTributacaoNacional: "Informe o código de tributação nacional antes de emitir NFSe.",
          },
        },
        422
      );
      return;
    }
    contasReceber = contasReceber.map((item) =>
      item.id === pagamentoId
        ? {
            ...item,
            nfseEmitida: true,
            nfseNumero: `NFS-${pagamentoId.toUpperCase()}`,
            dataEmissaoNfse: "2026-03-12",
          }
        : item
    );
    await fulfillJson(route, contasReceber.find((item) => item.id === pagamentoId) ?? {}, 200);
  });

  await page.route("**/api/v1/gerencial/agregadores/transacoes**", async (route) => {
    const request = route.request();
    const path = normalizePath(new URL(request.url()).pathname);
    if (request.method() === "GET" && path === "/api/v1/gerencial/agregadores/transacoes") {
      await fulfillJson(route, agregadores);
      return;
    }
    await fulfillJson(route, { message: `Unhandled ${request.method()} ${path}` }, 404);
  });

  await page.route("**/api/v1/gerencial/agregadores/transacoes/*/reprocessar**", async (route) => {
    const request = route.request();
    const path = normalizePath(new URL(request.url()).pathname);
    const transacaoId = path.split("/").at(-2) ?? "";
    agregadores = agregadores.map((item) =>
      item.id === transacaoId
        ? {
            ...item,
            statusRepasse: "LIQUIDADO",
            statusConciliacao: "CONCILIADA",
          }
        : item
    );
    await fulfillJson(route, agregadores.find((item) => item.id === transacaoId) ?? {}, 200);
  });

  await page.route("**/api/v1/administrativo/integracoes-operacionais**", async (route) => {
    const request = route.request();
    const path = normalizePath(new URL(request.url()).pathname);
    if (request.method() === "GET" && path === "/api/v1/administrativo/integracoes-operacionais") {
      await fulfillJson(route, integracoes);
      return;
    }
    await fulfillJson(route, { message: `Unhandled ${request.method()} ${path}` }, 404);
  });

  await page.route("**/api/v1/administrativo/integracoes-operacionais/*/reprocessar**", async (route) => {
    const request = route.request();
    const path = normalizePath(new URL(request.url()).pathname);
    const integracaoId = path.split("/").at(-2) ?? "";
    integracoes = integracoes.map((item) =>
      item.id === integracaoId
        ? {
            ...item,
            status: "SAUDAVEL",
            filaPendente: 0,
            ultimoErro: undefined,
            ultimaExecucaoEm: "2026-03-12T10:20:00",
            ultimaSucessoEm: "2026-03-12T10:20:00",
            ocorrencias: [
              {
                id: `occ-${integracaoId}-ok`,
                integracaoId,
                severidade: "INFO",
                mensagem: "Reprocessamento manual concluído e fila limpa.",
                dataCriacao: "2026-03-12T10:20:00",
              },
            ],
          }
        : item
    );
    await fulfillJson(route, integracoes.find((item) => item.id === integracaoId) ?? {}, 200);
  });
}

async function openAuthenticatedPage(page: Page, path: string, heading: string) {
  page.on("dialog", (dialog) => {
    void dialog.accept();
  });

  await seedAuthenticatedSession(page, {
    tenantId: "tenant-1",
    availableTenants: [{ tenantId: "tenant-1", defaultTenant: true }],
  });

  await page.goto(path, { waitUntil: "commit" });
  await page.waitForLoadState("domcontentloaded");
  await expect(page.getByRole("heading", { name: heading })).toBeVisible();
}

test.describe("Admin financeiro e integrações", () => {
  test.beforeEach(async ({ page }) => {
    await installAdminFinanceiroApi(page);
  });

  test("nfse salva e valida configuração fiscal", async ({ page }) => {
    await openAuthenticatedPage(page, "/administrativo/nfse", "NFSe e Fiscal");

    await page.getByPlaceholder("Ex.: 1301").fill("");
    await page.getByPlaceholder("Ex.: Rio de Janeiro").fill("Rio de Janeiro Capital");
    await page.getByRole("button", { name: "Salvar configuração" }).click();
    await expect(page.getByText("Informe o código de tributação nacional.", { exact: true })).toBeVisible();

    await page.getByPlaceholder("Ex.: 1301").fill("1402");
    await page.getByPlaceholder("Ex.: 1.1301.25.00").fill("1.1402.10.00");
    await page.getByPlaceholder("https://...").fill("https://hooks.example.test/fiscal");
    await page.getByRole("button", { name: "Salvar configuração" }).click();

    await expect(page.getByText("Configuração fiscal atualizada.")).toBeVisible();

    await page.getByRole("button", { name: "Validar configuração" }).click();
    await expect(page.getByText("Configuração validada com sucesso.")).toBeVisible();
    await expect(page.getByText("Configurada")).toBeVisible();
  });

  test("pagamentos em lote bloqueiam emissão quando a configuração fiscal volta para pendente", async ({ page }) => {
    await openAuthenticatedPage(page, "/administrativo/nfse", "NFSe e Fiscal");
    await page.getByPlaceholder("Ex.: Rio de Janeiro").fill("Rio Capital QA");
    await page.getByRole("button", { name: "Salvar configuração" }).click();
    await expect(page.getByText("Configuração fiscal atualizada.")).toBeVisible();

    await page.goto("/pagamentos/emitir-em-lote");
    await expect(page.getByRole("heading", { name: "Emitir NFS-e em lote" })).toBeVisible();
    await expect(page.getByText("Emissão fiscal bloqueada até concluir e validar a configuração tributária da unidade.")).toBeVisible();
    await expect(page.getByRole("button", { name: /Emitir em lote/i })).toBeDisabled();
  });

  test("recebimentos emite nfse para cobrança paga", async ({ page }) => {
    await openAuthenticatedPage(page, "/gerencial/recebimentos", "Recebimentos");

    const createdRow = page.getByRole("row").filter({ hasText: "Mensalidade Março" });
    await expect(createdRow).toBeVisible();
    await createdRow.getByRole("button", { name: "Emitir NFSe" }).click();

    await expect(page.getByText("NFSe emitida com sucesso.")).toBeVisible();
    await expect(createdRow.getByText(/NFS-/)).toBeVisible();
  });

  test("agregadores reprocessa divergência e monitoramento limpa falha", async ({ page }) => {
    await openAuthenticatedPage(page, "/gerencial/agregadores", "Agregadores");

    await page.getByRole("combobox").filter({ hasText: "Todos os repasses" }).click();
    await page.getByRole("option", { name: "Divergente" }).click();
    const divergentRow = page.getByRole("row").filter({ hasText: "000984" });
    await expect(divergentRow).toBeVisible();
    await divergentRow.getByRole("button", { name: "Reprocessar" }).click();
    await expect(page.getByText("Transação 000984 reprocessada.")).toBeVisible();
    await expect(divergentRow).not.toBeVisible();

    await page.goto("/administrativo/integracoes");
    await expect(page.getByRole("heading", { name: "Monitoramento de integrações" })).toBeVisible();
    const webhookCard = page.locator("div.rounded-xl.border").filter({ hasText: "Webhook comercial" }).first();
    await webhookCard.getByRole("button", { name: "Reprocessar" }).click();
    await expect(page.getByText("Integração reprocessada com sucesso.")).toBeVisible();
    await expect(webhookCard.getByText("Saudável")).toBeVisible();
  });
});
