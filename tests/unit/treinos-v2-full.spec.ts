import { expect, test } from "@playwright/test";
import {
  appendTreinoV2AssignmentHistory,
  buildTreinoV2AssignmentJob,
  buildTreinoV2EditorSeed,
  buildTreinoV2Observacoes,
  buildTreinoV2SaveInput,
  buildTreinoV2Template,
  buildTreinoV2TemplateSnapshot,
  createEmptyTreinoV2Block,
  parseExercicioV2Metadata,
  parseTreinoV2Metadata,
  serializeExercicioV2Descricao,
  summarizeTreinoV2AssignedGovernance,
  toTreinoV2CatalogExercise,
} from "../../src/lib/tenant/treinos/v2-runtime";
import {
  createTreinoV2MetricField,
  evaluateTreinoV2TemplateTransition,
  resolveTreinoV2AssignmentConflict,
  resolveTreinoV2Permissions,
  validateTreinoV2Template,
  type TreinoV2Template,
} from "../../src/lib/tenant/treinos/v2-domain";
import type { Exercicio, Treino } from "../../src/lib/types";

function makeTreino(overrides: Partial<Treino> = {}): Treino {
  return {
    id: "tpl-1",
    tenantId: "tn-1",
    nome: "Treino Base",
    templateNome: "Treino Base",
    objetivo: "Hipertrofia",
    divisao: "A",
    metaSessoesSemana: 3,
    frequenciaPlanejada: 3,
    quantidadePrevista: 12,
    dataInicio: "2026-03-10",
    dataFim: "2026-04-06",
    observacoes: "Notas do treino base",
    funcionarioId: "prof-1",
    funcionarioNome: "Paula Lima",
    status: "ATIVO",
    tipoTreino: "PRE_MONTADO",
    ativo: true,
    revisaoAtual: 1,
    revisoes: [
      {
        id: "rev-1",
        treinoId: "tpl-1",
        tipo: "CRIACAO",
        titulo: "Criação",
        criadoEm: "2026-03-10T09:00:00.000Z",
      },
    ],
    itens: [
      {
        id: "item-1",
        treinoId: "tpl-1",
        exercicioId: "ex-1",
        exercicioNome: "Agachamento",
        grupoMuscularNome: "Quadríceps",
        ordem: 1,
        series: 4,
        repeticoesMin: 8,
        repeticoesMax: 10,
        cargaSugerida: 60,
        intervaloSegundos: 90,
      },
    ],
    ...overrides,
  };
}

function makeTemplate(overrides: Partial<TreinoV2Template> = {}): TreinoV2Template {
  return {
    id: "tpl-v2-1",
    tenantId: "tn-1",
    nome: "Treino Base",
    frequenciaSemanal: 3,
    totalSemanas: 4,
    descricao: "Template base da suite.",
    categoria: "HIPERTROFIA",
    createdById: "prof-1",
    createdByName: "Paula Lima",
    unidadeId: "un-1",
    status: "RASCUNHO",
    precisaRevisao: false,
    versao: 1,
    versaoSimplificadaHabilitada: true,
    blocos: [
      {
        id: "bl-1",
        nome: "A - Base",
        ordem: 1,
        itens: [
          {
            id: "it-1",
            exerciseId: "ex-1",
            exerciseNome: "Agachamento",
            ordem: 1,
            objetivo: "FORCA",
            unidadeCarga: "kg",
            series: createTreinoV2MetricField(4),
            repeticoes: createTreinoV2MetricField("8-10"),
            carga: createTreinoV2MetricField(60),
            intervalo: createTreinoV2MetricField(90),
          },
        ],
      },
    ],
    ...overrides,
  };
}

test.describe("treinos v2 full", () => {
  test("cobre lifecycle do template com revisao, publicacao e persistencia", () => {
    const treino = makeTreino({
      itens: [
        {
          id: "item-1",
          treinoId: "tpl-1",
          exercicioId: "ex-1",
          exercicioNome: "Agachamento",
          grupoMuscularNome: "Quadríceps",
          ordem: 1,
          series: 4,
          repeticoes: 10,
          cargaSugerida: 60,
          intervaloSegundos: 90,
        },
      ],
    });
    const seed = buildTreinoV2EditorSeed(treino);

    const templateEmRevisao = buildTreinoV2Template({
      treino,
      editor: {
        nome: seed.nome,
        frequenciaSemanal: seed.frequenciaSemanal,
        totalSemanas: seed.totalSemanas,
        categoria: seed.categoria,
        templateStatus: "EM_REVISAO",
        versao: seed.versao + 1,
        versaoSimplificadaHabilitada: true,
        blocos: seed.blocos,
      },
    });

    const reviewGuard = evaluateTreinoV2TemplateTransition({
      from: "RASCUNHO",
      to: "EM_REVISAO",
      template: templateEmRevisao,
      permissionSet: resolveTreinoV2Permissions({
        role: "PROFESSOR",
        finePermissions: ["TREINO_PADRAO", "TREINO_PADRAO_PRESCREVER"],
      }),
    });

    const publishGuard = evaluateTreinoV2TemplateTransition({
      from: "EM_REVISAO",
      to: "PUBLICADO",
      template: templateEmRevisao,
      permissionSet: resolveTreinoV2Permissions({ role: "ADMINISTRADOR" }),
    });

    const payload = buildTreinoV2SaveInput({
      treino,
      editor: {
        ...seed,
        templateStatus: "EM_REVISAO",
        versaoSimplificadaHabilitada: true,
      },
    });
    const parsed = parseTreinoV2Metadata(payload.observacoes);
    expect(seed.mode).toBe("TEMPLATE");
    expect(templateEmRevisao.precisaRevisao).toBeTruthy();
    expect(reviewGuard.allowed).toBeTruthy();
    expect(publishGuard.allowed).toBeTruthy();
    expect(payload.status).toBe("RASCUNHO");
    expect(parsed.metadata?.template?.status).toBe("EM_REVISAO");
  });

  test("cobre renovacao e revisao de treino atribuido com snapshot e origem", () => {
    const templateBase = makeTreino({ id: "tpl-renovado", templateNome: "Treino Renovo" });
    const templateSeed = buildTreinoV2EditorSeed(templateBase);
    const snapshot = buildTreinoV2TemplateSnapshot({
      treino: templateBase,
      editor: {
        nome: templateSeed.nome,
        frequenciaSemanal: templateSeed.frequenciaSemanal,
        totalSemanas: templateSeed.totalSemanas,
        categoria: templateSeed.categoria,
        versao: 4,
        blocos: templateSeed.blocos,
      },
      publishedAt: "2026-03-14T10:00:00.000Z",
    });

    const treinoAtribuido = makeTreino({
      id: "tr-1",
      nome: "Treino Renovado",
      templateNome: "Treino Renovo",
      tipoTreino: "CUSTOMIZADO",
      treinoBaseId: templateBase.id,
      alunoId: "al-1",
      alunoNome: "Ana Paula",
      status: "ATIVO",
      ativo: true,
      dataInicio: "2099-01-01",
      dataFim: "2099-02-01",
      observacoes: buildTreinoV2Observacoes({
        observacoes: "Treino renovado a partir da base publicada.",
        assigned: {
          status: "AGENDADO",
          origem: "RENOVACAO",
          snapshot,
          customizadoLocalmente: true,
          assignmentJobId: "job-1",
          conflictPolicy: "AGENDAR_NOVO",
          resolution: "AGENDAR",
        },
      }),
      revisaoAtual: 2,
      renovadoDeTreinoId: templateBase.id,
    });

    const seed = buildTreinoV2EditorSeed(treinoAtribuido);
    const parsed = parseTreinoV2Metadata(treinoAtribuido.observacoes);
    const saveInput = buildTreinoV2SaveInput({
      treino: treinoAtribuido,
      editor: seed,
    });
    const summary = summarizeTreinoV2AssignedGovernance(treinoAtribuido);

    expect(seed.mode).toBe("ASSIGNED");
    expect(seed.assignedStatus).toBe("AGENDADO");
    expect(parsed.metadata?.assigned?.origem).toBe("RENOVACAO");
    expect(summary.templateOrigemId).toBe("tpl-renovado");
    expect(summary.templateOrigemNome).toBe("Treino Renovo");
    expect(summary.templateVersion).toBe(4);
    expect(summary.snapshotId).toBe("snapshot-tpl-renovado-v4");
    expect(summary.origem).toBe("RENOVACAO");
    expect(saveInput.status).toBe("ATIVO");
    expect(saveInput.ativo).toBeTruthy();
    expect(saveInput.observacoes).toContain("[[TREINO_V2_META]]");
  });

  test("cobre progressao de itens, historico de atribuicao e contagem de jobs", () => {
    const editor = buildTreinoV2EditorSeed(makeTreino());
    const secondBlock = createEmptyTreinoV2Block(1);
    secondBlock.itens.push({
      id: "it-2",
      exerciseId: "ex-2",
      exerciseNome: "Stiff",
      ordem: 1,
      objetivo: "POSTERIOR",
      series: createTreinoV2MetricField("5,5"),
      repeticoes: createTreinoV2MetricField("10-12"),
      carga: createTreinoV2MetricField("70"),
      intervalo: createTreinoV2MetricField("75"),
    });
    editor.blocos = [editor.blocos[0] ?? createEmptyTreinoV2Block(0), secondBlock];
    editor.templateStatus = "PUBLICADO";
    editor.versaoSimplificadaHabilitada = true;

    const saveInput = buildTreinoV2SaveInput({
      treino: makeTreino(),
      editor,
    });
    const job = buildTreinoV2AssignmentJob({
      tenantId: "tn-1",
      templateId: "tpl-1",
      templateVersion: 4,
      mode: "MASSA",
      conflictPolicy: "SUBSTITUIR_ATUAL",
      dataInicio: "2026-03-10",
      dataFim: "2026-04-06",
      requestedById: "coord-1",
      requestedByName: "Coordenação Técnica",
      targets: [
        { alunoId: "al-1", alunoNome: "Ana Paula" },
        { alunoId: "al-2", alunoNome: "Bruno Costa" },
        { alunoId: "al-3", alunoNome: "Carla Souza" },
      ],
      resultItems: [
        { alunoId: "al-1", alunoNome: "Ana Paula", resolution: "CRIAR", assignedWorkoutId: "tr-1" },
        { alunoId: "al-2", alunoNome: "Bruno Costa", resolution: "IGNORAR", motivo: "SEM_PERMISSAO" },
        {
          alunoId: "al-3",
          alunoNome: "Carla Souza",
          resolution: "SUBSTITUIR",
          assignedWorkoutId: "tr-3",
          motivo: "CONFLITO_RESOLVIDO",
        },
      ],
    });
    const history = appendTreinoV2AssignmentHistory(
      Array.from({ length: 20 }, (_, index) => ({
        id: `job-${index + 1}`,
        tenantId: "tn-1",
        templateId: "tpl-1",
        templateVersion: index + 1,
        mode: "INDIVIDUAL" as const,
        status: "CONCLUIDO" as const,
        conflictPolicy: "MANTER_ATUAL" as const,
        dataInicio: "2026-03-10",
        targets: [{ alunoId: `al-${index + 1}` }],
        requestedById: "prof-1",
      })),
      job,
    );

    expect(saveInput.itens).toHaveLength(2);
    expect(saveInput.itens[0]?.ordem).toBe(1);
    expect(saveInput.itens[0]?.repeticoesMin).toBe(8);
    expect(saveInput.itens[0]?.repeticoesMax).toBe(10);
    expect(saveInput.itens[1]?.ordem).toBe(101);
    expect(saveInput.itens[1]?.series).toBe(5.5);
    expect(saveInput.itens[1]?.repeticoesMin).toBe(10);
    expect(saveInput.itens[1]?.repeticoesMax).toBe(12);
    expect(job.status).toBe("CONCLUIDO_PARCIAL");
    expect(job.resultado?.totalSelecionado).toBe(3);
    expect(job.resultado?.totalAtribuido).toBe(1);
    expect(job.resultado?.totalIgnorado).toBe(1);
    expect(job.resultado?.totalComErro).toBe(1);
    expect(history).toHaveLength(20);
    expect(history[0]?.id).toBe(job.id);
    expect(history[19]?.id).toBe("job-19");
    expect(createTreinoV2MetricField("5,5")).toMatchObject({
      raw: "5,5",
      numericValue: 5.5,
      status: "VALIDO",
    });
  });

  test("cobre bordas de parsing, validacao, conflito e politica de transicao", () => {
    const malformedMetadata = parseTreinoV2Metadata("Notas antigas\n\n[[TREINO_V2_META]]\n{inv");
    const malformedExercise = parseExercicioV2Metadata("Descricao\n\n[[TREINO_V2_EXERCICIO_META]]\n{inv");
    const exercise = makeExercise();
    const catalogExercise = toTreinoV2CatalogExercise(exercise);
    const invalidTemplate = makeTemplate({
      nome: "",
      frequenciaSemanal: 0,
      totalSemanas: 0,
      blocos: [
        {
          id: "bl-1",
          nome: "A - Base",
          ordem: 1,
          itens: [
            {
              id: "it-1",
              ordem: 1,
              series: createTreinoV2MetricField("forca"),
              repeticoes: createTreinoV2MetricField("doze"),
              carga: createTreinoV2MetricField("leve"),
              intervalo: createTreinoV2MetricField("45s"),
            },
          ],
        },
      ],
    });
    const publishGuard = evaluateTreinoV2TemplateTransition({
      from: "EM_REVISAO",
      to: "PUBLICADO",
      template: invalidTemplate,
      permissionSet: resolveTreinoV2Permissions({ role: "ADMINISTRADOR" }),
    });

    expect(malformedMetadata.observacoes).toBe("Notas antigas\n\n[[TREINO_V2_META]]\n{inv");
    expect(malformedMetadata.metadata).toBeNull();
    expect(malformedExercise.descricao).toBe("Descricao\n\n[[TREINO_V2_EXERCICIO_META]]\n{inv");
    expect(malformedExercise.metadata.tipo).toBe("MUSCULACAO");
    expect(malformedExercise.metadata.disponivelNoApp).toBeTruthy();
    expect(catalogExercise.grupoExercicioNome).toBe("Aparelho Base");
    expect(validateTreinoV2Template(invalidTemplate).map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "TEMPLATE_NOME_OBRIGATORIO",
        "TEMPLATE_FREQUENCIA_OBRIGATORIA",
        "TEMPLATE_TOTAL_SEMANAS_OBRIGATORIO",
        "ITEM_SERIES_INVALIDO",
        "ITEM_REPETICOES_INVALIDO",
        "ITEM_CARGA_INVALIDA",
        "ITEM_INTERVALO_INVALIDO",
      ]),
    );
    expect(publishGuard.allowed).toBeFalsy();
    expect(publishGuard.reason).toBe("TEMPLATE_INVALIDO");
    expect(publishGuard.blockingCodes).toEqual(
      expect.arrayContaining(["TEMPLATE_NOME_OBRIGATORIO", "TEMPLATE_FREQUENCIA_OBRIGATORIA"]),
    );
    expect(resolveTreinoV2AssignmentConflict({ existingStatus: "ENCERRADO", policy: "MANTER_ATUAL" })).toBe("CRIAR");
    expect(resolveTreinoV2AssignmentConflict({ existingStatus: "SUBSTITUIDO", policy: "AGENDAR_NOVO" })).toBe(
      "CRIAR",
    );
    expect(resolveTreinoV2AssignmentConflict({ existingStatus: "ATIVO", policy: "MANTER_ATUAL" })).toBe("IGNORAR");
  });
});

function makeExercise(overrides: Partial<Exercicio> = {}): Exercicio {
  return {
    id: "ex-1",
    tenantId: "tn-1",
    nome: "Agachamento",
    grupoMuscularId: "gm-1",
    grupoMuscular: "Quadríceps",
    grupoMuscularNome: "Quadríceps",
    equipamento: "Aparelho Base",
    descricao: serializeExercicioV2Descricao({
      descricao: "Execucao controlada",
      metadata: {
        codigo: "AGH-001",
        grupoExercicioNome: "Aparelho Base",
        tipo: "MUSCULACAO",
        objetivoPadrao: "FORCA",
        midiaTipo: "VIDEO",
        midiaUrl: "https://cdn.local/agachamento.mp4",
        disponivelNoApp: true,
        similarExerciseIds: ["ex-2"],
      },
    }),
    unidade: "kg",
    ativo: true,
    ...overrides,
  };
}
