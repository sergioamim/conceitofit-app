import { expect, test, type Page } from "@playwright/test";

async function loginWithRedirect(page: Page, targetPath: string) {
  await page.goto(targetPath);
  await expect(page).toHaveURL(new RegExp(`/login\\?next=${encodeURIComponent(targetPath).replace(/\//g, "\\/")}`));

  await page.getByLabel("Usuário").fill("admin@academia.local");
  await page.getByLabel("Senha").fill("12345678");
  await page.getByRole("button", { name: "Entrar" }).click();

  const targetRegex = new RegExp(`${targetPath.replace(/\//g, "\\/")}$`);
  const navigatedDirectly = await page
    .waitForURL(targetRegex, { timeout: 1500 })
    .then(() => true)
    .catch(() => false);

  if (!navigatedDirectly) {
    const saveTenantButton = page.getByRole("button", { name: /Salvar e continuar/i });
    await expect(saveTenantButton).toBeVisible();
    await page.getByRole("combobox").click();
    await page.getByRole("option").first().click();
    await saveTenantButton.click();
  }

  await expect(page).toHaveURL(targetRegex);
}

async function installImportacaoEvoJobStubs(page: Page) {
  let arquivosSelecionadosNoJob = ["clientes", "contratos"];
  let pollingCount = 0;

  await page.route("**/admin/unidades/*/onboarding/job-status", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }

    const body = route.request().postDataJSON() as {
      tenantId?: string;
      academiaId?: string;
      jobId?: string;
      importStatus?: string;
    };

    await route.fulfill({
      status: 200,
      json: {
        tenantId: body.tenantId ?? "tenant-importacao-evo",
        academiaId: body.academiaId ?? "academia-sergio",
        estrategia: "PREPARAR_ETL",
        status: body.importStatus === "CONCLUIDO" ? "PRONTA" : "EM_IMPORTACAO",
        evoFilialId: "777",
        ultimaMensagem:
          body.importStatus === "CONCLUIDO" ? "Importação finalizada com sucesso." : `Job ${body.jobId ?? "job-evo-777"} em processamento.`,
        eventos: [],
      },
    });
  });

  await page.route("**/admin/unidades/*/onboarding", async (route) => {
    if (route.request().method() !== "PUT") {
      await route.fallback();
      return;
    }

    const body = route.request().postDataJSON() as {
      tenantId?: string;
      academiaId?: string;
      estrategia?: string;
      status?: string;
      evoFilialId?: string;
      ultimaMensagem?: string;
    };

    await route.fulfill({
      status: 200,
      json: {
        tenantId: body.tenantId ?? "tenant-importacao-evo",
        academiaId: body.academiaId ?? "academia-sergio",
        estrategia: body.estrategia ?? "PREPARAR_ETL",
        status: body.status ?? "AGUARDANDO_IMPORTACAO",
        evoFilialId: body.evoFilialId ?? "777",
        ultimaMensagem: body.ultimaMensagem ?? "Aguardando importação.",
        eventos: [],
      },
    });
  });

  await page.route("**/admin/integracoes/importacao-terceiros/evo/p0/pacote", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      json: {
        uploadId: "upload-evo-777",
        tenantId: null,
        evoUnidadeId: 777,
        filialResolvida: {
          evoFilialId: 777,
          evoAcademiaId: 99,
          nome: "Academia Sergio Amim - Unidade ETL",
          documento: "12.345.678/0001-90",
          cidade: "Sao Paulo",
          bairro: "Centro",
          email: "etl@qa.local",
          telefone: "1133334444",
          abreviacao: "ETL",
        },
        filiaisEncontradas: [
          {
            evoFilialId: 777,
            evoAcademiaId: 99,
            nome: "Academia Sergio Amim - Unidade ETL",
          },
        ],
        criadoEm: "2026-03-13T10:00:00Z",
        expiraEm: "2026-03-13T11:00:00Z",
        totalArquivosDisponiveis: 3,
        arquivos: [
          {
            chave: "clientes",
            rotulo: "Clientes",
            arquivoEsperado: "CLIENTES.csv",
            disponivel: true,
            nomeArquivoEnviado: "CLIENTES.csv",
            tamanhoBytes: 128,
          },
          {
            chave: "contratos",
            rotulo: "Contratos",
            arquivoEsperado: "CONTRATOS.csv",
            disponivel: true,
            nomeArquivoEnviado: "CONTRATOS.csv",
            tamanhoBytes: 96,
          },
          {
            chave: "recebimentos",
            rotulo: "Recebimentos",
            arquivoEsperado: "RECEBIMENTOS.csv",
            disponivel: true,
            nomeArquivoEnviado: "RECEBIMENTOS.csv",
            tamanhoBytes: 64,
          },
        ],
      },
    });
  });

  await page.route("**/admin/integracoes/importacao-terceiros/evo/p0/pacote/*/job", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }

    const body = route.request().postDataJSON() as {
      arquivos?: string[];
    };
    arquivosSelecionadosNoJob = Array.isArray(body.arquivos) && body.arquivos.length > 0 ? body.arquivos : arquivosSelecionadosNoJob;

    await route.fulfill({
      status: 200,
      json: {
        jobId: "job-evo-777",
        status: "PROCESSANDO",
        dryRun: false,
        solicitadoEm: "2026-03-13T10:05:00Z",
      },
    });
  });

  await page.route("**/admin/integracoes/importacao-terceiros/jobs/job-evo-777/p0**", async (route) => {
    pollingCount += 1;
    const concluiu = pollingCount >= 2;
    const resumoBase = {
      jobId: "job-evo-777",
      tenantIds: ["tenant-importacao-evo"],
      status: concluiu ? "CONCLUIDO" : "PROCESSANDO",
      solicitadoEm: "2026-03-13T10:05:00Z",
      finalizadoEm: concluiu ? "2026-03-13T10:07:00Z" : null,
      geral: { total: 12, processadas: concluiu ? 12 : 8, criadas: 9, atualizadas: 3, rejeitadas: 0 },
      clientes: { total: 5, processadas: 5, criadas: 4, atualizadas: 1, rejeitadas: 0 },
      contratos: { total: 4, processadas: 4, criadas: 3, atualizadas: 1, rejeitadas: 0 },
      recebimentos: { total: 3, processadas: 3, criadas: 2, atualizadas: 1, rejeitadas: 0 },
    };

    const resumoFiltrado = {
      ...resumoBase,
      clientes: arquivosSelecionadosNoJob.includes("clientes") ? resumoBase.clientes : undefined,
      contratos: arquivosSelecionadosNoJob.includes("contratos") ? resumoBase.contratos : undefined,
      recebimentos: resumoBase.recebimentos,
    };

    await route.fulfill({
      status: 200,
      json: resumoFiltrado,
    });
  });
}

test.describe("Backoffice importacao EVO", () => {
  test("cria unidade com ETL preparado e conclui job pelo fluxo principal", async ({ page }) => {
    const stamp = Date.now();
    const unidadeNome = `Unidade ETL ${stamp}`;
    const unidadeDocumento = String(stamp + 222_222).padStart(14, "0").slice(-14);
    const unidadeEmail = `etl-${stamp}@qa.local`;
    const jobAlias = `Carga EVO ${stamp}`;

    await loginWithRedirect(page, "/admin/unidades");
    await expect(page.getByRole("heading", { name: "Unidades (tenants)" })).toBeVisible();

    await page.getByLabel("Nome da unidade *").fill(unidadeNome);
    await page.getByLabel("Academia da unidade").click();
    await page.getByRole("option").first().click();
    await page.getByLabel("Documento *").fill(unidadeDocumento);
    await expect(page.getByLabel("Grupo da academia")).toHaveValue(/.+/);
    await page.getByLabel("Subdomínio").fill(`etl-${stamp}`);
    await page.getByLabel("E-mail *").fill(unidadeEmail);
    await page.getByLabel("Estratégia inicial da unidade").click();
    await page.getByRole("option", { name: "Preparar ETL agora" }).click();
    await page.getByLabel("ID Filial EVO").fill("777");
    await page.getByRole("button", { name: "Criar unidade" }).click();

    const unidadeRow = page.getByRole("row").filter({ hasText: unidadeNome });
    await expect(unidadeRow).toBeVisible();
    await expect(unidadeRow.getByText("Preparar ETL")).toBeVisible();
    await expect(unidadeRow.getByText("Aguardando importação")).toBeVisible();
    await expect(unidadeRow.getByText("EVO: 777")).toBeVisible();

    await unidadeRow.getByRole("link", { name: "Importação" }).click();
    await expect(page).toHaveURL(/\/admin\/importacao-evo\?tenantId=/);
    await expect(page.getByRole("heading", { name: "Acompanhamento de Importação EVO" })).toBeVisible();

    await installImportacaoEvoJobStubs(page);

    await page.getByRole("tab", { name: "Importar por Pacote (ZIP/CSV)" }).click();
    await page.locator("#pacoteArquivo").setInputFiles({
      name: "backup-evo.zip",
      mimeType: "application/zip",
      buffer: Buffer.from("conteudo"),
    });
    await page.getByRole("button", { name: "Analisar pacote" }).click();
    await expect(page.getByText("Upload ID:")).toBeVisible();
    await expect(page.getByText(/Selecionados:\s+\d+\s+de\s+\d+\s+disponíveis/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Desmarcar todos" })).toBeVisible();
    await page.getByRole("button", { name: "Desmarcar todos" }).click();
    await expect(page.getByRole("button", { name: "Criar Job" })).toBeDisabled();
    await page.getByRole("button", { name: "Selecionar disponíveis" }).click();
    await expect(page.getByRole("button", { name: "Criar Job" })).toBeEnabled();
    await page.locator('label:has-text("Recebimentos") input[type="checkbox"]').uncheck();
    await expect(page.getByText("Selecionados: 2 de 3 disponíveis")).toBeVisible();
    await page.getByRole("tabpanel", { name: "Importar por Pacote (ZIP/CSV)" }).getByLabel("Alias do job").fill(jobAlias);
    await page.getByRole("button", { name: "Criar Job" }).click();

    const acompanhamento = page.getByRole("tabpanel", { name: "Acompanhar Job" });
    await expect(acompanhamento.getByText("Job de importação")).toBeVisible();
    await expect(acompanhamento.getByText("CONCLUIDO").first()).toBeVisible({ timeout: 15000 });
    await expect(acompanhamento.getByLabel("Alias do job")).toHaveValue(jobAlias);
    await expect(acompanhamento.getByText("Últimos jobs salvos")).toBeVisible();
    await expect(acompanhamento.locator("summary").filter({ hasText: "Arquivos ignorados nesta execução (1)" })).toBeVisible();

    await page.goto("/admin/unidades");
    const unidadeAtualizada = page.getByRole("row").filter({ hasText: unidadeNome });
    await expect(unidadeAtualizada).toBeVisible();
  });
});
