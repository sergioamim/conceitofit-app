import { expect, test, type Page } from "@playwright/test";
import { installAdminCrudApiMocks, seedAuthenticatedSession } from "./support/backend-only-stubs";

async function loginWithRedirect(page: Page, targetPath: string) {
  await seedAuthenticatedSession(page, {
    tenantId: "tenant-importacao-evo",
    availableTenants: [{ tenantId: "tenant-importacao-evo", defaultTenant: true }],
  });
  await page.goto(targetPath);
}

async function installImportacaoEvoJobStubs(page: Page) {
  let arquivosSelecionadosNoJob = [
    "clientes",
    "contratos",
    "funcionarios",
    "funcionarios_funcoes",
    "funcionarios_funcoes_exercidas",
    "tipos_funcionarios",
    "funcionarios_tipos",
    "funcionarios_horarios",
    "permissoes",
  ];
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
        totalArquivosDisponiveis: 10,
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
          {
            chave: "funcionarios",
            rotulo: "Cadastro principal",
            arquivoEsperado: "FUNCIONARIOS.csv",
            disponivel: true,
            nomeArquivoEnviado: "FUNCIONARIOS.csv",
            tamanhoBytes: 256,
            dominio: "colaboradores",
            bloco: "fichaPrincipal",
            descricao: "Base do colaborador.",
          },
          {
            chave: "funcionarios_funcoes",
            rotulo: "Catálogo de funções",
            arquivoEsperado: "FUNCIONARIOS_FUNCOES.csv",
            disponivel: true,
            nomeArquivoEnviado: "FUNCIONARIOS_FUNCOES.csv",
            tamanhoBytes: 84,
            dominio: "colaboradores",
            bloco: "funcoes",
            descricao: "Catálogo legado de funções.",
          },
          {
            chave: "funcionarios_funcoes_exercidas",
            rotulo: "Funções exercidas",
            arquivoEsperado: "FUNCIONARIOS_FUNCOES_EXERCIDAS.csv",
            disponivel: true,
            nomeArquivoEnviado: "FUNCIONARIOS_FUNCOES_EXERCIDAS.csv",
            tamanhoBytes: 111,
            dominio: "colaboradores",
            bloco: "funcoes",
            descricao: "Relaciona colaboradores às funções.",
          },
          {
            chave: "tipos_funcionarios",
            rotulo: "Tipos operacionais",
            arquivoEsperado: "TIPOS_FUNCIONARIOS.csv",
            disponivel: true,
            nomeArquivoEnviado: "TIPOS_FUNCIONARIOS.csv",
            tamanhoBytes: 73,
            dominio: "colaboradores",
            bloco: "tiposOperacionais",
            descricao: "Catálogo de tipos.",
          },
          {
            chave: "funcionarios_tipos",
            rotulo: "Contratação e vínculos",
            arquivoEsperado: "FUNCIONARIOS_TIPOS.csv",
            disponivel: true,
            nomeArquivoEnviado: "FUNCIONARIOS_TIPOS.csv",
            tamanhoBytes: 79,
            dominio: "colaboradores",
            bloco: "contratacao",
            descricao: "Vínculo do colaborador com tipos operacionais.",
          },
          {
            chave: "funcionarios_horarios",
            rotulo: "Horários semanais",
            arquivoEsperado: "FUNCIONARIOS_HORARIOS.csv",
            disponivel: true,
            nomeArquivoEnviado: "FUNCIONARIOS_HORARIOS.csv",
            tamanhoBytes: 91,
            dominio: "colaboradores",
            bloco: "horarios",
            descricao: "Jornada semanal do colaborador.",
          },
          {
            chave: "permissoes",
            rotulo: "Perfil legado",
            arquivoEsperado: "PERMISSOES.csv",
            disponivel: true,
            nomeArquivoEnviado: "PERMISSOES.csv",
            tamanhoBytes: 72,
            dominio: "colaboradores",
            bloco: "perfilLegado",
            descricao: "Permissões legadas.",
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
      geral: { total: 19, processadas: concluiu ? 19 : 13, criadas: 13, atualizadas: 4, rejeitadas: concluiu ? 2 : 0 },
      clientes: { total: 5, processadas: 5, criadas: 4, atualizadas: 1, rejeitadas: 0 },
      contratos: { total: 4, processadas: 4, criadas: 3, atualizadas: 1, rejeitadas: 0 },
      recebimentos: { total: 3, processadas: 3, criadas: 2, atualizadas: 1, rejeitadas: 0 },
      funcionarios: { total: 12, processadas: 12, criadas: 7, atualizadas: 3, rejeitadas: concluiu ? 2 : 0 },
      colaboradoresDetalhe: {
        fichaPrincipal: { total: 4, processadas: 4, criadas: 3, atualizadas: 1, rejeitadas: 0 },
        funcoes: {
          total: 3,
          processadas: 3,
          criadas: 0,
          atualizadas: 2,
          rejeitadas: 1,
          parcial: true,
          mensagemParcial: "Uma função veio inválida e exigirá retry do bloco de cargos.",
        },
        tiposOperacionais: {
          total: 1,
          processadas: 1,
          criadas: 1,
          atualizadas: 0,
          rejeitadas: 0,
        },
        contratacao: {
          total: 1,
          processadas: 1,
          criadas: 1,
          atualizadas: 0,
          rejeitadas: 0,
        },
        horarios: {
          total: 2,
          processadas: 2,
          criadas: 1,
          atualizadas: 0,
          rejeitadas: 1,
          parcial: true,
          mensagemParcial: "Um horário semanal veio fora do intervalo permitido.",
        },
        perfilLegado: {
          total: 1,
          processadas: 1,
          criadas: 0,
          atualizadas: 1,
          rejeitadas: 0,
        },
      },
    };

    const resumoFiltrado = {
      ...resumoBase,
      clientes: arquivosSelecionadosNoJob.includes("clientes") ? resumoBase.clientes : undefined,
      contratos: arquivosSelecionadosNoJob.includes("contratos") ? resumoBase.contratos : undefined,
      recebimentos: resumoBase.recebimentos,
      funcionarios: arquivosSelecionadosNoJob.some(
        (item) => item.startsWith("funcionarios") || item === "permissoes" || item === "tipos_funcionarios"
      )
        ? resumoBase.funcionarios
        : undefined,
      colaboradoresDetalhe: arquivosSelecionadosNoJob.some(
        (item) => item.startsWith("funcionarios") || item === "permissoes" || item === "tipos_funcionarios"
      )
        ? resumoBase.colaboradoresDetalhe
        : undefined,
    };

    await route.fulfill({
      status: 200,
      json: resumoFiltrado,
    });
  });

  await page.route("**/admin/integracoes/importacao-terceiros/jobs/job-evo-777/rejeicoes**", async (route) => {
    await route.fulfill({
      status: 200,
      json: {
        items: [
          {
            id: "rej-funcao",
            entidade: "FUNCIONARIOS_FUNCOES_EXERCIDAS",
            arquivo: "FUNCIONARIOS_FUNCOES_EXERCIDAS.csv",
            linhaArquivo: 12,
            sourceId: "COLAB-12",
            motivo: "Função não encontrada no catálogo legado",
            criadoEm: "2026-03-13T10:08:00Z",
            bloco: "funcoes",
            payload: { funcionarioId: "COLAB-12", funcaoLegada: "Coach Senior" },
            mensagemAcionavel: "Importe o catálogo de funções antes de reprocessar este vínculo.",
            reprocessamento: {
              suportado: false,
              escopo: "funcoes",
              label: "Reprocessar funções",
              descricao: "Retry granular de funções ainda depende de endpoint dedicado.",
            },
          },
          {
            id: "rej-horario",
            entidade: "FUNCIONARIOS_HORARIOS",
            arquivo: "FUNCIONARIOS_HORARIOS.csv",
            linhaArquivo: 19,
            sourceId: "COLAB-99",
            motivo: "Horário semanal inválido",
            criadoEm: "2026-03-13T10:09:00Z",
            bloco: "horarios",
            payload: { diaSemana: "SEG", inicio: "25:00", fim: "27:00" },
            mensagemAcionavel: "Corrija o horário legado e reenvie apenas o bloco semanal.",
            reprocessamento: {
              suportado: true,
              escopo: "horarios",
              label: "Reprocessar horários",
              descricao: "Retry granular disponível para horários.",
            },
          },
        ],
        hasNext: false,
      },
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

    await installAdminCrudApiMocks(page);
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
    await expect(page.getByText("Malha de colaboradores", { exact: true })).toBeVisible();
    await expect(page.getByText("Horários", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Completo").first()).toBeVisible();
    await expect(page.getByText("Não reconhecido", { exact: true })).toHaveCount(0);
    await expect(page.getByText(/Selecionados:\s+\d+\s+de\s+\d+\s+disponíveis/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Desmarcar todos" })).toBeVisible();
    await page.getByRole("button", { name: "Desmarcar todos" }).click();
    await expect(page.getByRole("button", { name: "Criar Job" })).toBeDisabled();
    await page.getByRole("button", { name: "Selecionar disponíveis" }).click();
    await expect(page.getByRole("button", { name: "Criar Job" })).toBeEnabled();
    await page.locator('label:has-text("Recebimentos") input[type="checkbox"]').uncheck();
    await expect(page.getByText("Selecionados: 9 de 10 disponíveis")).toBeVisible();
    await page.getByRole("tabpanel", { name: "Importar por Pacote (ZIP/CSV)" }).getByLabel("Alias do job").fill(jobAlias);
    await page.getByRole("button", { name: "Criar Job" }).click();

    const acompanhamento = page.getByRole("tabpanel", { name: "Acompanhar Job" });
    await expect(acompanhamento.getByText("Job de importação")).toBeVisible();
    await expect(acompanhamento.getByText("CONCLUIDO").first()).toBeVisible({ timeout: 15000 });
    await expect(acompanhamento.getByLabel("Alias do job")).toHaveValue(jobAlias);
    await expect(acompanhamento.getByText("Diagnóstico de colaboradores")).toBeVisible();
    await expect(acompanhamento.getByText("Funções e cargos")).toBeVisible();
    await expect(acompanhamento.getByText("Tipos operacionais", { exact: true })).toBeVisible();
    await expect(acompanhamento.getByText("Contratação", { exact: true })).toBeVisible();
    await expect(acompanhamento.getByText("Perfil legado", { exact: true })).toBeVisible();
    await expect(acompanhamento.getByText("Últimos jobs salvos")).toBeVisible();
    await expect(acompanhamento.locator("summary").filter({ hasText: "Arquivos ignorados nesta execução (1)" })).toBeVisible();

    await acompanhamento.getByRole("button", { name: "Abrir rejeições" }).click();
    await expect(page.getByText("Rejeições", { exact: true })).toBeVisible();
    await page.getByLabel("Filtrar por bloco").click();
    await page.getByRole("option", { name: "Horários" }).click();
    await expect(page.getByText("Retry disponível")).toBeVisible();
    await expect(page.getByText("Corrija o horário legado e reenvie apenas o bloco semanal.")).toBeVisible();
    await expect(page.getByText('"inicio": "25:00"')).toBeVisible();
    await page.getByLabel("Selecionar para retry").check();
    await expect(page.getByText("Reprocesso seletivo preparado")).toBeVisible();

    await page.goto("/admin/unidades");
    const unidadeAtualizada = page.getByRole("row").filter({ hasText: unidadeNome });
    await expect(unidadeAtualizada).toBeVisible();
  });
});
