import { expect, test, type Page, type Request, type Route } from "@playwright/test";

type ContaSeed = {
  id: string;
  tenantId: string;
  apelido: string;
  banco: string;
  agencia: string;
  conta: string;
  digito: string;
  tipo: "CORRENTE" | "POUPANCA" | "PAGAMENTO";
  titular: string;
  pixChave?: string;
  pixTipo?: "CPF" | "CNPJ" | "EMAIL" | "TELEFONE" | "CHAVE_ALEATORIA" | "OUTRA";
  statusCadastro: "ATIVA" | "INATIVA";
};

type MaquininhaSeed = {
  id: string;
  tenantId: string;
  nome: string;
  adquirente: "STONE" | "CIELO" | "REDE" | "GETNET" | "PAGARME_POS" | "OUTROS";
  terminal: string;
  contaBancariaId: string;
  statusCadastro: "ATIVA" | "INATIVA";
};

type ConciliacaoLinhaSeed = {
  id: string;
  tenantId: string;
  contaBancariaId: string;
  chaveConciliacao: string;
  origem: "MANUAL" | "OFX" | "STONE";
  status: "PENDENTE" | "CONCILIADA" | "IGNORADA";
  dataMovimento: string;
  descricao?: string;
  documento?: string;
  valor: number;
  tipoMovimento: "CREDITO" | "DEBITO";
  contaReceberId?: string;
  contaPagarId?: string;
  observacao?: string;
};

async function fulfillJson(route: Route, json: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify(json),
  });
}

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

async function openAuthenticatedPage(page: Page, path: string, heading: string) {
  await page.goto("/login");
  await page.getByLabel("Usuário").fill("admin@academia.local");
  await page.getByLabel("Senha").fill("12345678");
  await page.getByRole("button", { name: "Entrar" }).click();

  const unitStep = page.getByRole("heading", { name: "Unidade prioritária" });
  if (await unitStep.isVisible()) {
    await page.getByRole("combobox").click();
    await page.getByRole("option").first().click();
    await page.getByRole("button", { name: /Salvar e continuar/i }).click();
  }

  await page.goto(path);
  await expect(page.getByRole("heading", { name: heading })).toBeVisible();
}

async function mockContasBancariasApi(
  page: Page,
  initialRows: ContaSeed[],
  options?: {
    validationErrorApelido?: string;
  }
) {
  let contas = [...initialRows];
  const missingTenantRequests: string[] = [];

  await page.route("**/api/v1/gerencial/financeiro/contas-bancarias**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = normalizePath(url.pathname);
    const method = request.method();
    const tenantId = getTenantId(request);

    if (!tenantId) {
      missingTenantRequests.push(`${method} ${path}`);
      await fulfillJson(route, { message: "tenantId obrigatório" }, 400);
      return;
    }

    if (path === "/api/v1/gerencial/financeiro/contas-bancarias" && method === "GET") {
      await fulfillJson(route, contas);
      return;
    }

    if (path === "/api/v1/gerencial/financeiro/contas-bancarias" && method === "POST") {
      const payload = parseBody<Partial<ContaSeed>>(request);
      if (payload.apelido === options?.validationErrorApelido) {
        await fulfillJson(route, {
          message: "Validation error",
          fieldErrors: {
            apelido: "obrigatório",
          },
        }, 400);
        return;
      }

      const created: ContaSeed = {
        id: `conta-${contas.length + 1}`,
        tenantId,
        apelido: payload.apelido ?? "Conta",
        banco: payload.banco ?? "Banco",
        agencia: payload.agencia ?? "0001",
        conta: payload.conta ?? "12345",
        digito: payload.digito ?? "0",
        tipo: payload.tipo ?? "CORRENTE",
        titular: payload.titular ?? "Titular",
        pixChave: payload.pixChave,
        pixTipo: payload.pixTipo,
        statusCadastro: "ATIVA",
      };
      contas = [created, ...contas];
      await fulfillJson(route, created, 201);
      return;
    }

    if (/^\/api\/v1\/gerencial\/financeiro\/contas-bancarias\/[^/]+\/toggle$/.test(path) && method === "PATCH") {
      const contaId = path.split("/").at(-2) ?? "";
      contas = contas.map((conta) =>
        conta.id === contaId
          ? {
              ...conta,
              statusCadastro: conta.statusCadastro === "ATIVA" ? "INATIVA" : "ATIVA",
            }
          : conta
      );
      await fulfillJson(route, contas.find((conta) => conta.id === contaId) ?? {}, 200);
      return;
    }

    if (/^\/api\/v1\/gerencial\/financeiro\/contas-bancarias\/[^/]+$/.test(path) && method === "PUT") {
      const contaId = path.split("/").at(-1) ?? "";
      const payload = parseBody<Partial<ContaSeed>>(request);
      contas = contas.map((conta) => (conta.id === contaId ? { ...conta, ...payload } : conta));
      await fulfillJson(route, contas.find((conta) => conta.id === contaId) ?? {}, 200);
      return;
    }

    await fulfillJson(route, { message: `Unhandled ${method} ${path}` }, 404);
  });

  return {
    missingTenantRequests,
  };
}

async function mockMaquininhasApi(page: Page, initialRows: MaquininhaSeed[]) {
  let maquininhas = [...initialRows];
  const missingTenantRequests: string[] = [];

  await page.route("**/api/v1/gerencial/financeiro/maquininhas**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = normalizePath(url.pathname);
    const method = request.method();
    const tenantId = getTenantId(request);

    if (!tenantId) {
      missingTenantRequests.push(`${method} ${path}`);
      await fulfillJson(route, { message: "tenantId obrigatório" }, 400);
      return;
    }

    if (path === "/api/v1/gerencial/financeiro/maquininhas" && method === "GET") {
      await fulfillJson(route, maquininhas);
      return;
    }

    if (path === "/api/v1/gerencial/financeiro/maquininhas" && method === "POST") {
      const payload = parseBody<Partial<MaquininhaSeed>>(request);
      const created: MaquininhaSeed = {
        id: `maq-${maquininhas.length + 1}`,
        tenantId,
        nome: payload.nome ?? "Maquininha",
        adquirente: payload.adquirente ?? "STONE",
        terminal: payload.terminal ?? "T000",
        contaBancariaId: payload.contaBancariaId ?? "",
        statusCadastro: "ATIVA",
      };
      maquininhas = [created, ...maquininhas];
      await fulfillJson(route, created, 201);
      return;
    }

    await fulfillJson(route, { message: `Unhandled ${method} ${path}` }, 404);
  });

  return {
    missingTenantRequests,
  };
}

async function mockConciliacaoApi(page: Page, initialRows: ConciliacaoLinhaSeed[]) {
  let linhas = [...initialRows];
  const missingTenantRequests: string[] = [];

  await page.route("**/api/v1/gerencial/financeiro/conciliacao-bancaria/linhas**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = normalizePath(url.pathname);
    const method = request.method();
    const tenantId = getTenantId(request);

    if (!tenantId) {
      missingTenantRequests.push(`${method} ${path}`);
      await fulfillJson(route, { message: "tenantId obrigatório" }, 400);
      return;
    }

    if (path === "/api/v1/gerencial/financeiro/conciliacao-bancaria/linhas" && method === "GET") {
      await fulfillJson(route, linhas);
      return;
    }

    if (path === "/api/v1/gerencial/financeiro/conciliacao-bancaria/linhas" && method === "POST") {
      const payload = parseBody<{ linhas?: Array<Partial<ConciliacaoLinhaSeed>> }>(request);
      const created = (payload.linhas ?? []).map((item, index) => ({
        id: `linha-${linhas.length + index + 1}`,
        tenantId,
        contaBancariaId: item.contaBancariaId ?? "",
        chaveConciliacao: item.chaveConciliacao ?? `DOC-${linhas.length + index + 1}`,
        origem: item.origem ?? "MANUAL",
        status: "PENDENTE" as const,
        dataMovimento: item.dataMovimento ?? "2026-03-10",
        descricao: item.descricao,
        documento: item.documento,
        valor: Number(item.valor) || 0,
        tipoMovimento: item.tipoMovimento ?? "CREDITO",
        observacao: item.observacao,
      }));
      linhas = [...created, ...linhas];
      await fulfillJson(route, created, 200);
      return;
    }

    await fulfillJson(route, { message: `Unhandled ${method} ${path}` }, 404);
  });

  return {
    missingTenantRequests,
  };
}

test.describe("Financeiro admin pages", () => {
  test("contas bancárias aguarda tenant e mostra field errors da API", async ({ page }) => {
    const { missingTenantRequests } = await mockContasBancariasApi(page, [
      {
        id: "conta-1",
        tenantId: "tenant-1",
        apelido: "Conta principal",
        banco: "Banco do Brasil",
        agencia: "0001",
        conta: "12345",
        digito: "9",
        tipo: "CORRENTE",
        titular: "Academia Fit",
        pixChave: "financeiro@academia.local",
        pixTipo: "EMAIL",
        statusCadastro: "ATIVA",
      },
    ], {
      validationErrorApelido: "Conta inválida",
    });

    await openAuthenticatedPage(page, "/administrativo/contas-bancarias", "Contas bancárias");

    await expect(page.getByRole("button", { name: "Nova conta bancária" })).toBeEnabled();
    await expect(page.getByRole("row").filter({ hasText: "Conta principal" })).toBeVisible();

    await page.getByRole("button", { name: "Nova conta bancária" }).click();
    await page.getByPlaceholder("Ex.: Conta principal").fill("Conta inválida");
    await page.getByPlaceholder("Ex.: Banco do Brasil").fill("Caixa");
    await page.getByPlaceholder("Ex.: 0001").fill("1234");
    await page.getByPlaceholder("Ex.: 12345-6").fill("778899");
    await page.getByPlaceholder("Ex.: 9").fill("1");
    await page.getByPlaceholder("Nome completo do titular").fill("Academia Matriz");
    await page.getByRole("button", { name: "Salvar" }).click();

    await expect(page.getByText("apelido: obrigatório")).toBeVisible();

    await page.getByPlaceholder("Ex.: Conta principal").fill("Conta reserva");
    await page.getByRole("button", { name: "Salvar" }).click();

    await expect(page.getByText("Conta cadastrada.")).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "Conta reserva" })).toBeVisible();
    expect(missingTenantRequests).toEqual([]);
  });

  test("maquininhas carrega e salva usando o tenant resolvido", async ({ page }) => {
    const contasMock = await mockContasBancariasApi(page, [
      {
        id: "conta-1",
        tenantId: "tenant-1",
        apelido: "Conta principal",
        banco: "Banco do Brasil",
        agencia: "0001",
        conta: "12345",
        digito: "9",
        tipo: "CORRENTE",
        titular: "Academia Fit",
        statusCadastro: "ATIVA",
      },
    ]);
    const maquininhasMock = await mockMaquininhasApi(page, [
      {
        id: "maq-1",
        tenantId: "tenant-1",
        nome: "POS Recepção",
        adquirente: "STONE",
        terminal: "T001",
        contaBancariaId: "conta-1",
        statusCadastro: "ATIVA",
      },
    ]);

    await openAuthenticatedPage(page, "/administrativo/maquininhas", "Maquininhas");

    await expect(page.getByRole("button", { name: "Nova maquininha" })).toBeEnabled();
    await expect(page.getByRole("row").filter({ hasText: "POS Recepção" })).toBeVisible();

    await page.getByRole("button", { name: "Nova maquininha" }).click();
    await page.getByPlaceholder("Ex.: POS Recepção").fill("POS Studio");
    await page.getByPlaceholder("Ex.: T001").fill("T077");
    await page.getByRole("button", { name: "Salvar" }).click();

    await expect(page.getByText("Maquininha cadastrada.")).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "POS Studio" })).toBeVisible();
    expect(contasMock.missingTenantRequests).toEqual([]);
    expect(maquininhasMock.missingTenantRequests).toEqual([]);
  });

  test("conciliação bancária importa linhas só depois de resolver o tenant", async ({ page }) => {
    const contasMock = await mockContasBancariasApi(page, [
      {
        id: "conta-1",
        tenantId: "tenant-1",
        apelido: "Conta principal",
        banco: "Banco do Brasil",
        agencia: "0001",
        conta: "12345",
        digito: "9",
        tipo: "CORRENTE",
        titular: "Academia Fit",
        statusCadastro: "ATIVA",
      },
    ]);
    const conciliacaoMock = await mockConciliacaoApi(page, []);

    await openAuthenticatedPage(page, "/administrativo/conciliacao-bancaria", "Conciliação bancária");

    await page.locator("textarea").fill(
      JSON.stringify([
        {
          chaveConciliacao: "DOC-777",
          dataMovimento: "2026-03-10",
          valor: 199.9,
          tipoMovimento: "CREDITO",
          descricao: "Mensalidade de março",
        },
      ])
    );
    await page.getByRole("button", { name: "Importar linhas" }).click();

    await expect(page.getByText("Importação concluída.")).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: "DOC-777" })).toBeVisible();
    expect(contasMock.missingTenantRequests).toEqual([]);
    expect(conciliacaoMock.missingTenantRequests).toEqual([]);
  });
});
