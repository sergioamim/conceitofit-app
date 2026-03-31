import { expect, test } from "@playwright/test";
import {
  appendTreinoV2AssignmentHistory,
  buildTreinoV2AssignmentJob,
  buildTreinoV2EditorSeed,
  buildTreinoV2SaveInput,
  buildTreinoV2Observacoes,
  buildTreinoV2TemplateSnapshot,
  parseExercicioV2Metadata,
  parseTreinoV2Metadata,
  serializeExercicioV2Descricao,
  summarizeTreinoV2AssignedGovernance,
  summarizeTreinoV2TemplateGovernance,
  toTreinoV2CatalogExercise,
} from "../../src/lib/tenant/treinos/v2-runtime";
import type { Exercicio, Treino } from "../../src/lib/types";

function makeTreino(overrides: Partial<Treino> = {}): Treino {
  return {
    id: "tpl-1",
    tenantId: "tn-1",
    nome: "Template Base",
    templateNome: "Template Base",
    objetivo: "Hipertrofia",
    frequenciaPlanejada: 3,
    metaSessoesSemana: 3,
    quantidadePrevista: 12,
    dataInicio: "2026-03-10",
    dataFim: "2026-04-06",
    tipoTreino: "PRE_MONTADO",
    status: "ATIVO",
    ativo: true,
    funcionarioId: "prof-1",
    funcionarioNome: "Paula Lima",
    observacoes: "Notas públicas do template",
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
      },
    ],
    ...overrides,
  };
}

test.describe("treinos v2 runtime", () => {
  test("deriva seed do editor a partir de template legado", () => {
    const seed = buildTreinoV2EditorSeed(makeTreino());

    expect(seed.mode).toBe("TEMPLATE");
    expect(seed.templateStatus).toBe("PUBLICADO");
    expect(seed.totalSemanas).toBe(4);
    expect(seed.blocos).toHaveLength(1);
    expect(seed.blocos[0]?.itens[0]?.exerciseNome).toBe("Agachamento");
    expect(seed.blocos[0]?.itens[0]?.repeticoes.raw).toBe("8-10");
  });

  test("gera payload de save com metadata embutida e status de rascunho", () => {
    const treino = makeTreino({ status: "RASCUNHO" });
    const editor = buildTreinoV2EditorSeed(treino);
    editor.templateStatus = "EM_REVISAO";
    editor.versaoSimplificadaHabilitada = true;
    editor.assignmentHistory = appendTreinoV2AssignmentHistory(
      [],
      buildTreinoV2AssignmentJob({
        tenantId: "tn-1",
        templateId: treino.id,
        templateVersion: editor.versao,
        mode: "INDIVIDUAL",
        conflictPolicy: "MANTER_ATUAL",
        dataInicio: "2026-03-10",
        requestedById: "prof-1",
        requestedByName: "Paula Lima",
        targets: [{ alunoId: "al-1", alunoNome: "Ana Paula" }],
        resultItems: [{ alunoId: "al-1", alunoNome: "Ana Paula", resolution: "CRIAR", assignedWorkoutId: "tr-1" }],
      }),
    );

    const payload = buildTreinoV2SaveInput({
      treino,
      editor,
    });
    const parsed = parseTreinoV2Metadata(payload.observacoes);

    expect(payload.status).toBe("RASCUNHO");
    expect(parsed.observacoes).toBe("Notas públicas do template");
    expect(parsed.metadata?.template?.status).toBe("EM_REVISAO");
    expect(parsed.metadata?.template?.versaoSimplificadaHabilitada).toBeTruthy();
    expect(parsed.metadata?.template?.assignmentHistory).toHaveLength(1);
  });

  test("serializa e desserializa metadata rica de exercício", () => {
    const descricao = serializeExercicioV2Descricao({
      descricao: "Execução controlada.",
      metadata: {
        codigo: "AGH-001",
        grupoExercicioNome: "Básicos",
        tipo: "MUSCULACAO",
        objetivoPadrao: "FORCA",
        midiaTipo: "VIDEO",
        midiaUrl: "https://cdn.local/agachamento.mp4",
        disponivelNoApp: true,
        similarExerciseIds: ["ex-2"],
      },
    });

    const exercicio: Exercicio = {
      id: "ex-1",
      tenantId: "tn-1",
      nome: "Agachamento",
      grupoMuscularId: "gm-1",
      grupoMuscularNome: "Quadríceps",
      descricao,
      unidade: "kg",
      ativo: true,
    };

    const parsed = parseExercicioV2Metadata(descricao);
    const catalog = toTreinoV2CatalogExercise(exercicio);

    expect(parsed.descricao).toBe("Execução controlada.");
    expect(parsed.metadata.codigo).toBe("AGH-001");
    expect(catalog.codigo).toBe("AGH-001");
    expect(catalog.midiaTipo).toBe("VIDEO");
    expect(catalog.similarExerciseIds).toEqual(["ex-2"]);
  });

  test("resume governança de template com fila de revisão e clientes impactados", () => {
    const treino = makeTreino({ status: "RASCUNHO" });
    const editor = buildTreinoV2EditorSeed(treino);
    editor.templateStatus = "EM_REVISAO";
    editor.assignmentHistory = appendTreinoV2AssignmentHistory(
      [],
      buildTreinoV2AssignmentJob({
        tenantId: "tn-1",
        templateId: treino.id,
        templateVersion: editor.versao,
        mode: "MASSA",
        conflictPolicy: "SUBSTITUIR_ATUAL",
        dataInicio: "2026-03-10",
        dataFim: "2026-04-06",
        requestedById: "coord-1",
        requestedByName: "Coordenação Técnica",
        targets: [
          { alunoId: "al-1", alunoNome: "Ana Paula" },
          { alunoId: "al-2", alunoNome: "Bruno Costa" },
        ],
        resultItems: [
          { alunoId: "al-1", alunoNome: "Ana Paula", resolution: "CRIAR", assignedWorkoutId: "tr-1" },
          { alunoId: "al-2", alunoNome: "Bruno Costa", resolution: "CRIAR", assignedWorkoutId: "tr-2" },
        ],
      }),
    );

    const payload = buildTreinoV2SaveInput({ treino, editor });
    const summary = summarizeTreinoV2TemplateGovernance({
      ...treino,
      status: payload.status,
      observacoes: payload.observacoes,
    });

    expect(summary.status).toBe("EM_REVISAO");
    expect(summary.needsReview).toBeTruthy();
    expect(summary.reviewReason).toBe("EM_REVISAO");
    expect(summary.impactedClients).toBe(2);
    expect(summary.assignmentJobs).toBe(1);
  });

  test("resume rastreabilidade de treino atribuído com snapshot e origem", () => {
    const template = makeTreino({ id: "tpl-governanca", status: "ATIVO" });
    const templateEditor = buildTreinoV2EditorSeed(template);
    const snapshot = buildTreinoV2TemplateSnapshot({
      treino: template,
      editor: {
        nome: templateEditor.nome,
        frequenciaSemanal: templateEditor.frequenciaSemanal,
        totalSemanas: templateEditor.totalSemanas,
        categoria: templateEditor.categoria,
        versao: 3,
        blocos: templateEditor.blocos,
      },
      publishedAt: "2026-03-14T10:00:00.000Z",
    });

    const assigned = makeTreino({
      id: "tr-atribuido",
      tipoTreino: "CUSTOMIZADO",
      treinoBaseId: template.id,
      templateNome: template.templateNome,
      alunoId: "al-1",
      alunoNome: "Ana Paula",
      observacoes: buildTreinoV2Observacoes({
        observacoes: "Aluno recebeu o treino publicado.",
        assigned: {
          status: "ATIVO",
          origem: "MASSA",
          snapshot,
          customizadoLocalmente: true,
          assignmentJobId: "job-1",
          conflictPolicy: "SUBSTITUIR_ATUAL",
          resolution: "CRIAR",
        },
      }),
    });

    const summary = summarizeTreinoV2AssignedGovernance(assigned);

    expect(summary.status).toBe("ATIVO");
    expect(summary.templateOrigemId).toBe("tpl-governanca");
    expect(summary.templateOrigemNome).toBe("Template Base");
    expect(summary.templateVersion).toBe(3);
    expect(summary.snapshotId).toBe("snapshot-tpl-governanca-v3");
    expect(summary.customizadoLocalmente).toBeTruthy();
    expect(summary.origem).toBe("MASSA");
  });
});
