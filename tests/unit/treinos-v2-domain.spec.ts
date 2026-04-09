import { expect, test } from "@playwright/test";
import {
  createTreinoV2MetricField,
  evaluateTreinoV2TemplateTransition,
  resolveTreinoV2AssignmentConflict,
  resolveTreinoV2Permissions,
  validateTreinoV2Template,
  type TreinoV2Template,
} from "../../src/lib/tenant/treinos/v2-domain";

function makeTemplate(overrides: Partial<TreinoV2Template> = {}): TreinoV2Template {
  return {
    id: "tpl-v2-1",
    tenantId: "tn-1",
    nome: "Treino Base Posterior",
    frequenciaSemanal: 4,
    totalSemanas: 8,
    descricao: "Template base da suite.",
    categoria: "HIPERTROFIA",
    createdById: "prof-1",
    createdByName: "Paula Lima",
    unidadeId: "un-1",
    status: "RASCUNHO",
    precisaRevisao: false,
    versao: 3,
    versaoSimplificadaHabilitada: true,
    blocos: [
      {
        id: "bl-1",
        nome: "A - Posterior",
        ordem: 1,
        itens: [
          {
            id: "it-1",
            exerciseId: "ex-1",
            exerciseNome: "Levantamento terra",
            ordem: 1,
            objetivo: "FORCA",
            unidadeCarga: "kg",
            series: createTreinoV2MetricField(4),
            repeticoes: createTreinoV2MetricField(10),
            carga: createTreinoV2MetricField(60),
            intervalo: createTreinoV2MetricField(90),
          },
        ],
      },
    ],
    ...overrides,
  };
}

test.describe("treinos v2 domain", () => {
  test("valida template e bloqueia publicacao quando ha campos obrigatorios faltando ou migracao invalida", () => {
    const invalid = makeTemplate({
      nome: "",
      frequenciaSemanal: 0,
      totalSemanas: undefined,
      blocos: [
        {
          id: "bl-1",
          nome: "A - Revisao",
          ordem: 1,
          itens: [
            {
              id: "it-1",
              ordem: 1,
              exerciseNome: "Agachamento livre",
              series: createTreinoV2MetricField("3x10"),
              repeticoes: createTreinoV2MetricField("doze"),
              carga: createTreinoV2MetricField("leve"),
              intervalo: createTreinoV2MetricField("45s"),
            },
          ],
        },
      ],
    });

    const issues = validateTreinoV2Template(invalid);
    const codes = issues.map((issue) => issue.code);

    expect(codes).toEqual(
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
  });

  test("governanca separa submissao para revisao de publicacao", () => {
    const template = makeTemplate({ status: "EM_REVISAO" });
    const professor = resolveTreinoV2Permissions({
      role: "PROFESSOR",
      finePermissions: ["TREINO_PADRAO", "TREINO_PADRAO_PRESCREVER", "TREINOS_PERSONALIZAR_EXERCICIO"],
    });
    const admin = resolveTreinoV2Permissions({ role: "ADMINISTRADOR" });

    const reviewGuard = evaluateTreinoV2TemplateTransition({
      from: "RASCUNHO",
      to: "EM_REVISAO",
      template: makeTemplate(),
      permissionSet: professor,
    });
    const publishDenied = evaluateTreinoV2TemplateTransition({
      from: "EM_REVISAO",
      to: "PUBLICADO",
      template,
      permissionSet: professor,
    });
    const publishAllowed = evaluateTreinoV2TemplateTransition({
      from: "EM_REVISAO",
      to: "PUBLICADO",
      template,
      permissionSet: admin,
    });

    expect(reviewGuard.allowed).toBeTruthy();
    expect(publishDenied.allowed).toBeFalsy();
    expect(publishDenied.reason).toBe("SEM_PERMISSAO_PARA_PUBLICAR");
    expect(publishAllowed.allowed).toBeTruthy();
  });

  test("permissoes finas e politicas de conflito fecham o comportamento operacional", () => {
    const operacao = resolveTreinoV2Permissions({
      role: "OPERACAO",
      finePermissions: ["TREINO_PADRAO_PRESCREVER", "TREINOS_SOMENTE_EDITAR_CARGA"],
    });

    expect(operacao.canAssignIndividual).toBeTruthy();
    expect(operacao.canAssignMassively).toBeFalsy();
    expect(operacao.assignedEditScope).toBe("LOAD_ONLY");

    expect(resolveTreinoV2AssignmentConflict({ existingStatus: "ATIVO", policy: "MANTER_ATUAL" })).toBe("IGNORAR");
    expect(resolveTreinoV2AssignmentConflict({ existingStatus: "ATIVO", policy: "SUBSTITUIR_ATUAL" })).toBe(
      "SUBSTITUIR",
    );
    expect(resolveTreinoV2AssignmentConflict({ existingStatus: "ATIVO", policy: "AGENDAR_NOVO" })).toBe("AGENDAR");
    expect(resolveTreinoV2AssignmentConflict({ existingStatus: "ENCERRADO", policy: "MANTER_ATUAL" })).toBe("CRIAR");

  });

});
