import { expect, test, type Page } from "@playwright/test";
import { openAdminCrudPage } from "./support/admin-crud-helpers";
import { createBrowserErrorGuard } from "./support/browser-errors";

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
  const pollingCountByJob = new Map<string, number>();

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
            ultimoProcessamento: {
              jobId: "job-clientes-1",
              alias: "Carga clientes completa",
              status: "CONCLUIDO",
              processadoEm: "2026-03-12T09:00:00Z",
              resumo: {
                total: 20,
                processadas: 20,
                criadas: 12,
                atualizadas: 8,
                rejeitadas: 0,
              },
              retrySomenteErrosSuportado: false,
            },
          },
          {
            chave: "contratos",
            rotulo: "Contratos",
            arquivoEsperado: "CONTRATOS.csv",
            disponivel: true,
            nomeArquivoEnviado: "CONTRATOS.csv",
            tamanhoBytes: 96,
            ultimoProcessamento: {
              jobId: "job-contratos-1",
              status: "CONCLUIDO_COM_REJEICOES",
              processadoEm: "2026-03-12T09:30:00Z",
              resumo: {
                total: 6,
                processadas: 6,
                criadas: 4,
                atualizadas: 2,
                rejeitadas: 0,
              },
              parcial: true,
              mensagemParcial: "Um contrato exigiu reconciliação manual de vigência.",
              retrySomenteErrosSuportado: false,
            },
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
            ultimoProcessamento: {
              jobId: "job-funcoes-1",
              alias: "Funções com inconsistências",
              status: "CONCLUIDO_COM_REJEICOES",
              processadoEm: "2026-03-12T10:10:00Z",
              resumo: {
                total: 8,
                processadas: 8,
                criadas: 0,
                atualizadas: 5,
                rejeitadas: 3,
              },
              parcial: true,
              mensagemParcial: "Três vínculos vieram com função inexistente.",
              retrySomenteErrosSuportado: false,
            },
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
      apelido?: string;
      tenantId?: string;
      evoUnidadeId?: number;
      retrySomenteErros?: boolean;
    };
    const tenantHeader = route.request().headers()["x-tenant-id"];
    if (!body.tenantId || typeof body.tenantId !== "string" || !body.tenantId.trim()) {
      await route.fulfill({
        status: 400,
        json: {
          message: "tenantId obrigatorio no create job do pacote EVO",
        },
      });
      return;
    }
    if (!tenantHeader || tenantHeader !== body.tenantId) {
      await route.fulfill({
        status: 400,
        json: {
          message: "X-Tenant-Id deve acompanhar o tenantId do body no create job do pacote EVO",
        },
      });
      return;
    }
    if ("evoUnidadeId" in body && (!Number.isInteger(body.evoUnidadeId) || Number(body.evoUnidadeId) <= 0)) {
      await route.fulfill({
        status: 400,
        json: {
          message: "evoUnidadeId invalido no create job do pacote EVO",
        },
      });
      return;
    }
    if ("retrySomenteErros" in body) {
      await route.fulfill({
        status: 400,
        json: {
          message: "retrySomenteErros nao faz parte do DTO atual do create job do pacote EVO",
        },
      });
      return;
    }
    arquivosSelecionadosNoJob = Array.isArray(body.arquivos) && body.arquivos.length > 0 ? body.arquivos : arquivosSelecionadosNoJob;

    await route.fulfill({
      status: 202,
      json: {
        jobId: "job-evo-777",
        status: "PROCESSANDO",
        dryRun: false,
        solicitadoEm: "2026-03-13T10:05:00Z",
      },
    });
  });

  await page.route("**/admin/integracoes/importacao-terceiros/jobs/*/p0**", async (route) => {
    const jobId = route.request().url().split("/jobs/")[1]?.split("/")[0] ?? "job-evo-777";
    const pollingCount = (pollingCountByJob.get(jobId) ?? 0) + 1;
    pollingCountByJob.set(jobId, pollingCount);
    const concluiu = pollingCount >= 2;
    if (jobId === "job-funcoes-1") {
      await route.fulfill({
        status: 200,
        json: {
          jobId,
          tenantIds: ["tenant-importacao-evo"],
          status: "CONCLUIDO_COM_REJEICOES",
          solicitadoEm: "2026-03-12T10:05:00Z",
          finalizadoEm: "2026-03-12T10:10:00Z",
          geral: { total: 8, processadas: 8, criadas: 0, atualizadas: 5, rejeitadas: 3 },
          funcionarios: { total: 8, processadas: 8, criadas: 0, atualizadas: 5, rejeitadas: 3 },
          colaboradoresDetalhe: {
            funcoes: {
              total: 8,
              processadas: 8,
              criadas: 0,
              atualizadas: 5,
              rejeitadas: 3,
              parcial: true,
              mensagemParcial: "Três vínculos vieram com função inexistente.",
              arquivosSelecionados: ["FUNCIONARIOS_FUNCOES.csv", "FUNCIONARIOS_FUNCOES_EXERCIDAS.csv"],
            },
          },
        },
      });
      return;
    }
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
        fichaPrincipal: {
          total: 4,
          processadas: 4,
          criadas: 3,
          atualizadas: 1,
          rejeitadas: 0,
          arquivosSelecionados: ["FUNCIONARIOS.csv"],
        },
        funcoes: {
          total: 3,
          processadas: 3,
          criadas: 0,
          atualizadas: 2,
          rejeitadas: 1,
          parcial: true,
          mensagemParcial: "Uma função veio inválida e exigirá retry do bloco de cargos.",
          arquivosSelecionados: ["FUNCIONARIOS_FUNCOES.csv", "FUNCIONARIOS_FUNCOES_EXERCIDAS.csv"],
        },
        tiposOperacionais: {
          total: 1,
          processadas: 1,
          criadas: 1,
          atualizadas: 0,
          rejeitadas: 0,
          arquivosSelecionados: ["TIPOS_FUNCIONARIOS.csv"],
        },
        contratacao: {
          total: 1,
          processadas: 1,
          criadas: 1,
          atualizadas: 0,
          rejeitadas: 0,
          arquivosSelecionados: ["FUNCIONARIOS_TIPOS.csv"],
        },
        horarios: {
          total: 0,
          processadas: 0,
          criadas: 0,
          atualizadas: 0,
          rejeitadas: 0,
          arquivosSelecionados: ["FUNCIONARIOS_HORARIOS.csv"],
        },
        perfilLegado: {
          total: 0,
          processadas: 0,
          criadas: 0,
          atualizadas: 0,
          rejeitadas: 0,
          arquivosSelecionados: [],
          arquivosAusentes: ["PERMISSOES.csv"],
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

  await page.route("**/admin/integracoes/importacao-terceiros/jobs/*/rejeicoes**", async (route) => {
    const jobId = route.request().url().split("/jobs/")[1]?.split("/")[0] ?? "job-evo-777";
    if (jobId === "job-funcoes-1") {
      await route.fulfill({
        status: 200,
        json: {
          items: [
            {
              id: "rej-funcao-historico",
              entidade: "FUNCIONARIOS_FUNCOES_EXERCIDAS",
              arquivo: "FUNCIONARIOS_FUNCOES_EXERCIDAS.csv",
              linhaArquivo: 12,
              sourceId: "COLAB-12",
              motivo: "Função não encontrada no catálogo legado",
              criadoEm: "2026-03-12T10:11:00Z",
              bloco: "funcoes",
              payload: { funcionarioId: "COLAB-12", funcaoLegada: "Coach Senior" },
              mensagemAcionavel: "Reenvie a malha de funções após corrigir o catálogo legado.",
              reprocessamento: {
                suportado: false,
                escopo: "funcoes",
                label: "Reprocessar funções",
                descricao: "Retry granular de funções ainda depende de endpoint dedicado.",
              },
            },
          ],
          hasNext: false,
        },
      });
      return;
    }
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
  test("abre uma unidade seedada e conclui job EVO por pacote no fluxo principal", async ({ page }) => {
    const browserErrors = createBrowserErrorGuard(page);
    const unidadeNome = "Unidade Barra";
    const jobAlias = `Carga EVO ${Date.now()}`;

    await openAdminCrudPage(page, "/admin/unidades");
    await expect(page.getByRole("heading", { name: "Unidades (tenants)" })).toBeVisible();

    const unidadeRow = page.getByRole("row").filter({ hasText: unidadeNome });
    await expect(unidadeRow).toBeVisible();

    await installImportacaoEvoJobStubs(page);

    await unidadeRow.getByRole("link", { name: "Importação EVO" }).click();
    await expect(page).toHaveURL(/\/admin\/importacao-evo\?tenantId=tenant-barra/);
    await expect(page.getByRole("heading", { name: "Gestor de Importação" })).toBeVisible();
    await expect(page.getByText("Etapa 1: Analisar pacote ZIP")).toBeVisible();

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
    const clientesHistoricoCard = page.locator('label').filter({ hasText: "Clientes" }).first();
    const contratosHistoricoCard = page.locator('label').filter({ hasText: "Contratos" }).first();
    const recebimentosHistoricoCard = page.locator('label').filter({ hasText: "Recebimentos" }).first();
    await expect(clientesHistoricoCard.getByText("Carga clientes completa")).toBeVisible();
    await expect(clientesHistoricoCard.getByText("job-clientes-1")).toBeVisible();
    await expect(clientesHistoricoCard.getByText("Sucesso")).toBeVisible();
    await expect(clientesHistoricoCard.getByText("Processadas: 20")).toBeVisible();
    await expect(contratosHistoricoCard.getByText("Parcial")).toBeVisible();
    await expect(recebimentosHistoricoCard.getByText("Nunca importado")).toBeVisible();
    const funcoesHistoricoCard = page.locator('label').filter({ hasText: "Funções exercidas" }).first();
    const retryFuncoesButton = funcoesHistoricoCard.locator(
      'button:has-text("Tentar somente erros (aguardando backend)")',
    );
    const verRejeicoesFuncoesButton = funcoesHistoricoCard.locator(
      'button:has-text("Ver rejeições")',
    );
    await expect(funcoesHistoricoCard.getByText("Com erros")).toBeVisible();
    await expect(retryFuncoesButton).toBeDisabled();
    await verRejeicoesFuncoesButton.click();
    const acompanhamentoSheet = page.getByRole("dialog");
    await expect(page.getByRole("heading", { name: "Diagnóstico do Lote" })).toBeVisible();
    await expect(acompanhamentoSheet.getByText("job-funcoes-1")).toBeVisible();
    await expect(acompanhamentoSheet.getByText(/^Rejeições$/)).toBeVisible();
    await expect(page.getByText("Reenvie a malha de funções após corrigir o catálogo legado.")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("heading", { name: "Diagnóstico do Lote" })).toHaveCount(0);

    await page.getByRole("button", { name: "Desmarcar todos" }).click();
    await expect(page.getByRole("button", { name: "Criar Job" })).toBeDisabled();
    await page.getByRole("button", { name: "Selecionar disponíveis" }).click();
    await expect(page.getByRole("button", { name: "Criar Job" })).toBeEnabled();
    await page.locator('label:has-text("Recebimentos") input[type="checkbox"]').uncheck();
    await expect(page.getByText("Selecionados: 9 de 10 disponíveis")).toBeVisible();
    await page.getByLabel("Nome de identificação deste lote").fill(jobAlias);
    await page.getByRole("button", { name: "Criar Job" }).click();

    const acompanhamento = page.getByRole("dialog");
    await expect(page.getByRole("heading", { name: "Diagnóstico do Lote" })).toBeVisible();
    await expect(acompanhamento.getByText("Job de importação")).toBeVisible();
    await expect(acompanhamento.getByText("CONCLUIDO").first()).toBeVisible({ timeout: 15000 });
    await expect(acompanhamento.getByLabel("Alias do job")).toHaveValue(jobAlias);
    await expect(acompanhamento.getByText("Diagnóstico de colaboradores", { exact: true }).first()).toBeVisible();
    await expect(acompanhamento.getByText("Funções e cargos", { exact: true }).first()).toBeVisible();
    await expect(acompanhamento.getByText("Tipos operacionais", { exact: true }).first()).toBeVisible();
    await expect(acompanhamento.getByText("Contratação", { exact: true }).first()).toBeVisible();
    await expect(acompanhamento.getByText("Perfil legado", { exact: true }).first()).toBeVisible();
    await expect(acompanhamento.getByText("Sem linhas", { exact: true })).toBeVisible();
    await expect(acompanhamento.getByText("Não selecionado", { exact: true })).toBeVisible();
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

    await page.goto("/admin/unidades", { waitUntil: "domcontentloaded" });
    const unidadeAtualizada = page.getByRole("row").filter({ hasText: unidadeNome });
    await expect(unidadeAtualizada).toBeVisible();
    await browserErrors.assertNoUnexpectedErrors("Happy path da importação EVO emitiu erro no browser");
  });
});
