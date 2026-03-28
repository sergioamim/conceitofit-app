export type TreinoV2TemplateStatus = "RASCUNHO" | "EM_REVISAO" | "PUBLICADO" | "ARQUIVADO";
export type TreinoV2AssignedStatus = "RASCUNHO" | "AGENDADO" | "ATIVO" | "ENCERRADO" | "SUBSTITUIDO";
export type TreinoV2AssignmentMode = "INDIVIDUAL" | "MASSA";
export type TreinoV2AssignmentJobStatus =
  | "PENDENTE"
  | "PROCESSANDO"
  | "CONCLUIDO"
  | "CONCLUIDO_PARCIAL"
  | "FALHOU"
  | "CANCELADO";
export type TreinoV2AssignmentConflictPolicy = "MANTER_ATUAL" | "SUBSTITUIR_ATUAL" | "AGENDAR_NOVO";
export type TreinoV2AssignmentResolution = "CRIAR" | "IGNORAR" | "SUBSTITUIR" | "AGENDAR";
export type TreinoV2TechniqueType = "CONJUGADO" | "PROGRESSIVO" | "DROP_SET" | "REPLICAR_SERIE";
export type TreinoV2FieldStatus = "VAZIO" | "VALIDO" | "INVALIDO";
export type TreinoV2ExerciseMediaType = "IMAGEM" | "GIF" | "VIDEO";
export type TreinoV2ExerciseType = "MUSCULACAO" | "CARDIO" | "MOBILIDADE" | "ALONGAMENTO" | "FUNCIONAL" | "OUTRO";
export type TreinoV2DefaultObjective =
  | "HIPERTROFIA"
  | "FORCA"
  | "RESISTENCIA"
  | "MOBILIDADE"
  | "EMAGRECIMENTO"
  | "REABILITACAO"
  | "CONDICIONAMENTO"
  | "OUTRO";
export type TreinoV2Role = "PROFESSOR" | "COORDENADOR_TECNICO" | "ADMINISTRADOR" | "OPERACAO";
export type TreinoV2AssignedEditScope = "NONE" | "LOAD_ONLY" | "FULL";

export type TreinoV2FinePermissionKey =
  | "EXERCICIOS"
  | "TREINO_PADRAO"
  | "TREINO_PADRAO_PRESCREVER"
  | "TREINOS_PRESCREVER"
  | "TREINOS_PRESCREVER_OUTRAS_CARTEIRAS"
  | "TREINOS_PERSONALIZAR_EXERCICIO"
  | "TREINOS_SOMENTE_EDITAR_CARGA"
  | "TREINOS_CONSULTAR_OUTRAS_CARTEIRAS"
  | "TREINO_EXIBIR_QTD_RESULTADOS";

export type TreinoV2ValidationSeverity = "ERROR" | "WARNING";
export type TreinoV2ValidationCode =
  | "TEMPLATE_NOME_OBRIGATORIO"
  | "TEMPLATE_FREQUENCIA_OBRIGATORIA"
  | "TEMPLATE_TOTAL_SEMANAS_OBRIGATORIO"
  | "TEMPLATE_SEM_BLOCOS"
  | "BLOCO_SEM_ITENS"
  | "ITEM_EXERCICIO_OBRIGATORIO"
  | "ITEM_SERIES_INVALIDO"
  | "ITEM_REPETICOES_INVALIDO"
  | "ITEM_CARGA_INVALIDA"
  | "ITEM_INTERVALO_INVALIDO";

export interface TreinoV2MetricField {
  raw: string;
  numericValue?: number;
  status: TreinoV2FieldStatus;
}

export interface TreinoV2Technique {
  type: TreinoV2TechniqueType;
  observacao?: string;
}

export interface TreinoV2ExerciseItem {
  id: string;
  exerciseId?: string;
  exerciseNome?: string;
  ordem: number;
  objetivo?: string;
  unidadeCarga?: string;
  regulagem?: string;
  observacoes?: string;
  series: TreinoV2MetricField;
  repeticoes: TreinoV2MetricField;
  carga?: TreinoV2MetricField;
  intervalo?: TreinoV2MetricField;
  tecnicas?: TreinoV2Technique[];
}

export interface TreinoV2Block {
  id: string;
  nome: string;
  ordem: number;
  objetivo?: string;
  observacoes?: string;
  itens: TreinoV2ExerciseItem[];
}

export interface TreinoV2ValidationIssue {
  code: TreinoV2ValidationCode;
  severity: TreinoV2ValidationSeverity;
  fieldPath: string;
  message: string;
}

export interface TreinoV2Template {
  id: string;
  tenantId: string;
  nome: string;
  frequenciaSemanal?: number;
  totalSemanas?: number;
  descricao?: string;
  categoria?: string;
  createdById?: string;
  createdByName?: string;
  unidadeId?: string;
  status: TreinoV2TemplateStatus;
  precisaRevisao: boolean;
  versao: number;
  versaoSimplificadaHabilitada: boolean;
  blocos: TreinoV2Block[];
  validationIssues?: TreinoV2ValidationIssue[];
}

export interface TreinoV2TemplateSnapshot {
  id: string;
  templateId: string;
  templateVersion: number;
  templateNome: string;
  publishedAt?: string;
  publishedById?: string;
  frequenciaSemanal?: number;
  totalSemanas?: number;
  descricao?: string;
  categoria?: string;
  blocos: TreinoV2Block[];
  validationIssues: TreinoV2ValidationIssue[];
}

export interface TreinoV2AssignedWorkout {
  id: string;
  tenantId: string;
  alunoId: string;
  alunoNome: string;
  professorResponsavelId?: string;
  professorResponsavelNome?: string;
  templateOrigemId?: string;
  origem: "TEMPLATE" | "MANUAL" | "MASSA" | "REUTILIZACAO" | "RENOVACAO";
  snapshot: TreinoV2TemplateSnapshot;
  status: TreinoV2AssignedStatus;
  dataInicio: string;
  dataFim?: string;
  customizadoLocalmente: boolean;
}

export interface TreinoV2AssignmentFilter {
  contratoIds?: string[];
  niveis?: string[];
  generos?: string[];
}

export interface TreinoV2AssignmentTarget {
  alunoId: string;
  alunoNome?: string;
}

export interface TreinoV2AssignmentResultItem {
  alunoId: string;
  alunoNome?: string;
  resolution: TreinoV2AssignmentResolution;
  assignedWorkoutId?: string;
  motivo?: string;
}

export interface TreinoV2AssignmentJob {
  id: string;
  tenantId: string;
  templateId: string;
  templateVersion: number;
  requestedAt?: string;
  mode: TreinoV2AssignmentMode;
  status: TreinoV2AssignmentJobStatus;
  conflictPolicy: TreinoV2AssignmentConflictPolicy;
  dataInicio: string;
  dataFim?: string;
  filtro?: TreinoV2AssignmentFilter;
  targets: TreinoV2AssignmentTarget[];
  requestedById: string;
  requestedByName?: string;
  resultado?: {
    totalSelecionado: number;
    totalAtribuido: number;
    totalIgnorado: number;
    totalComErro: number;
    itens: TreinoV2AssignmentResultItem[];
  };
}

export interface TreinoV2PermissionSet {
  canViewTemplates: boolean;
  canCreateTemplate: boolean;
  canEditOwnTemplate: boolean;
  canEditPublishedTemplate: boolean;
  canSubmitForReview: boolean;
  canPublishTemplate: boolean;
  canArchiveTemplate: boolean;
  canManageExerciseCatalog: boolean;
  canAssignIndividual: boolean;
  canAssignMassively: boolean;
  canViewOtherPortfolios: boolean;
  canAssignOtherPortfolios: boolean;
  canViewTemplateResultCounts: boolean;
  canAdjustAssignedWorkout: boolean;
  assignedEditScope: TreinoV2AssignedEditScope;
}

export interface TreinoV2TemplateTransitionGuard {
  allowed: boolean;
  blockingCodes: TreinoV2ValidationCode[];
  reason?: string;
}

export const TREINOS_V2_FINE_PERMISSION_LABELS: Record<TreinoV2FinePermissionKey, string> = {
  EXERCICIOS: "Exercicios",
  TREINO_PADRAO: "Treino padrao",
  TREINO_PADRAO_PRESCREVER: "Treino padrao - prescrever",
  TREINOS_PRESCREVER: "Treinos - prescrever",
  TREINOS_PRESCREVER_OUTRAS_CARTEIRAS: "Treinos - prescrever outras carteiras",
  TREINOS_PERSONALIZAR_EXERCICIO: "Treinos - personalizar exercicio",
  TREINOS_SOMENTE_EDITAR_CARGA: "Treinos - somente editar carga",
  TREINOS_CONSULTAR_OUTRAS_CARTEIRAS: "Treinos - consultar outras carteiras",
  TREINO_EXIBIR_QTD_RESULTADOS: "Treino - exibir quantidade de resultados",
};

export const TREINOS_V2_TEMPLATE_STATUS_TRANSITIONS: Record<TreinoV2TemplateStatus, TreinoV2TemplateStatus[]> = {
  RASCUNHO: ["EM_REVISAO", "PUBLICADO", "ARQUIVADO"],
  EM_REVISAO: ["RASCUNHO", "PUBLICADO", "ARQUIVADO"],
  PUBLICADO: ["EM_REVISAO", "ARQUIVADO"],
  ARQUIVADO: [],
};

export const TREINOS_V2_DECISIONS = {
  allowsMultipleActiveAssignedWorkouts: false,
  batchAssignmentExecution: "ASSINCRONA",
  requiresStartDateForAssignment: true,
  allowsEndDateOverride: true,
  allowsCrossPortfolioEditOnlyWithPermission: true,
  bulkReassignToNewVersionPhase: "P1",
} as const;

function normalizeNumericInput(value: number | string | null | undefined): string {
  if (value == null) return "";
  return String(value).trim();
}

export function createTreinoV2MetricField(value?: number | string | null): TreinoV2MetricField {
  const raw = normalizeNumericInput(value);
  if (!raw) {
    return {
      raw: "",
      status: "VAZIO",
    };
  }

  const normalized = raw.replace(",", ".");
  const numericValue = Number(normalized);

  if (!Number.isFinite(numericValue)) {
    return {
      raw,
      status: "INVALIDO",
    };
  }

  return {
    raw,
    numericValue,
    status: "VALIDO",
  };
}

function buildIssue(
  code: TreinoV2ValidationCode,
  fieldPath: string,
  message: string,
  severity: TreinoV2ValidationSeverity = "ERROR",
): TreinoV2ValidationIssue {
  return {
    code,
    fieldPath,
    message,
    severity,
  };
}

export function validateTreinoV2Template(template: TreinoV2Template): TreinoV2ValidationIssue[] {
  const issues: TreinoV2ValidationIssue[] = [];

  if (!template.nome.trim()) {
    issues.push(buildIssue("TEMPLATE_NOME_OBRIGATORIO", "nome", "Template precisa ter nome."));
  }

  if (!template.frequenciaSemanal || template.frequenciaSemanal <= 0) {
    issues.push(
      buildIssue("TEMPLATE_FREQUENCIA_OBRIGATORIA", "frequenciaSemanal", "Frequencia semanal precisa ser maior que zero."),
    );
  }

  if (!template.totalSemanas || template.totalSemanas <= 0) {
    issues.push(
      buildIssue("TEMPLATE_TOTAL_SEMANAS_OBRIGATORIO", "totalSemanas", "Total de semanas precisa ser maior que zero."),
    );
  }

  if (template.blocos.length === 0) {
    issues.push(buildIssue("TEMPLATE_SEM_BLOCOS", "blocos", "Template precisa ter ao menos um bloco."));
  }

  template.blocos.forEach((bloco, blocoIndex) => {
    if (bloco.itens.length === 0) {
      issues.push(
        buildIssue("BLOCO_SEM_ITENS", `blocos.${blocoIndex}.itens`, "Bloco precisa ter ao menos um exercicio.", "WARNING"),
      );
    }

    bloco.itens.forEach((item, itemIndex) => {
      const basePath = `blocos.${blocoIndex}.itens.${itemIndex}`;

      if (!item.exerciseId && !item.exerciseNome?.trim()) {
        issues.push(buildIssue("ITEM_EXERCICIO_OBRIGATORIO", `${basePath}.exerciseId`, "Item precisa de exercicio."));
      }

      if (item.series.status === "INVALIDO") {
        issues.push(
          buildIssue("ITEM_SERIES_INVALIDO", `${basePath}.series`, "Series precisam ser numericas para publicar."),
        );
      }

      if (item.repeticoes.status === "INVALIDO") {
        issues.push(
          buildIssue(
            "ITEM_REPETICOES_INVALIDO",
            `${basePath}.repeticoes`,
            "Repeticoes precisam ser numericas para publicar.",
          ),
        );
      }

      if (item.carga?.status === "INVALIDO") {
        issues.push(buildIssue("ITEM_CARGA_INVALIDA", `${basePath}.carga`, "Carga precisa ser numerica para publicar."));
      }

      if (item.intervalo?.status === "INVALIDO") {
        issues.push(
          buildIssue(
            "ITEM_INTERVALO_INVALIDO",
            `${basePath}.intervalo`,
            "Intervalo precisa ser numerico para publicar.",
          ),
        );
      }
    });
  });

  return issues;
}

export function isTreinoV2TemplatePublishable(template: TreinoV2Template): boolean {
  return validateTreinoV2Template(template).every((issue) => issue.severity !== "ERROR");
}

export function resolveTreinoV2Permissions(input: {
  role: TreinoV2Role;
  finePermissions?: TreinoV2FinePermissionKey[];
}): TreinoV2PermissionSet {
  const granted = new Set(input.finePermissions ?? []);

  const baseByRole: Record<TreinoV2Role, TreinoV2PermissionSet> = {
    PROFESSOR: {
      canViewTemplates: true,
      canCreateTemplate: true,
      canEditOwnTemplate: true,
      canEditPublishedTemplate: false,
      canSubmitForReview: true,
      canPublishTemplate: false,
      canArchiveTemplate: false,
      canManageExerciseCatalog: false,
      canAssignIndividual: true,
      canAssignMassively: false,
      canViewOtherPortfolios: false,
      canAssignOtherPortfolios: false,
      canViewTemplateResultCounts: false,
      canAdjustAssignedWorkout: true,
      assignedEditScope: "FULL",
    },
    COORDENADOR_TECNICO: {
      canViewTemplates: true,
      canCreateTemplate: true,
      canEditOwnTemplate: true,
      canEditPublishedTemplate: true,
      canSubmitForReview: true,
      canPublishTemplate: true,
      canArchiveTemplate: true,
      canManageExerciseCatalog: true,
      canAssignIndividual: true,
      canAssignMassively: true,
      canViewOtherPortfolios: true,
      canAssignOtherPortfolios: true,
      canViewTemplateResultCounts: true,
      canAdjustAssignedWorkout: true,
      assignedEditScope: "FULL",
    },
    ADMINISTRADOR: {
      canViewTemplates: true,
      canCreateTemplate: true,
      canEditOwnTemplate: true,
      canEditPublishedTemplate: true,
      canSubmitForReview: true,
      canPublishTemplate: true,
      canArchiveTemplate: true,
      canManageExerciseCatalog: true,
      canAssignIndividual: true,
      canAssignMassively: true,
      canViewOtherPortfolios: true,
      canAssignOtherPortfolios: true,
      canViewTemplateResultCounts: true,
      canAdjustAssignedWorkout: true,
      assignedEditScope: "FULL",
    },
    OPERACAO: {
      canViewTemplates: true,
      canCreateTemplate: false,
      canEditOwnTemplate: false,
      canEditPublishedTemplate: false,
      canSubmitForReview: false,
      canPublishTemplate: false,
      canArchiveTemplate: false,
      canManageExerciseCatalog: false,
      canAssignIndividual: false,
      canAssignMassively: false,
      canViewOtherPortfolios: false,
      canAssignOtherPortfolios: false,
      canViewTemplateResultCounts: false,
      canAdjustAssignedWorkout: false,
      assignedEditScope: "NONE",
    },
  };

  const next = { ...baseByRole[input.role] };

  if (granted.has("EXERCICIOS")) {
    next.canManageExerciseCatalog = true;
  }

  if (granted.has("TREINO_PADRAO")) {
    next.canCreateTemplate = true;
    next.canEditOwnTemplate = true;
  }

  if (granted.has("TREINO_PADRAO_PRESCREVER")) {
    next.canAssignIndividual = true;
  }

  if (granted.has("TREINOS_PRESCREVER")) {
    next.canAdjustAssignedWorkout = true;
  }

  if (granted.has("TREINOS_PRESCREVER_OUTRAS_CARTEIRAS")) {
    next.canAssignOtherPortfolios = true;
    next.canViewOtherPortfolios = true;
  }

  if (granted.has("TREINOS_CONSULTAR_OUTRAS_CARTEIRAS")) {
    next.canViewOtherPortfolios = true;
  }

  if (granted.has("TREINO_EXIBIR_QTD_RESULTADOS")) {
    next.canViewTemplateResultCounts = true;
  }

  if (granted.has("TREINOS_PERSONALIZAR_EXERCICIO")) {
    next.canAdjustAssignedWorkout = true;
    next.assignedEditScope = "FULL";
  }

  if (granted.has("TREINOS_SOMENTE_EDITAR_CARGA") && next.assignedEditScope !== "FULL") {
    next.canAdjustAssignedWorkout = true;
    next.assignedEditScope = "LOAD_ONLY";
  }

  return next;
}

export function evaluateTreinoV2TemplateTransition(input: {
  from: TreinoV2TemplateStatus;
  to: TreinoV2TemplateStatus;
  template: TreinoV2Template;
  permissionSet: TreinoV2PermissionSet;
}): TreinoV2TemplateTransitionGuard {
  if (input.from === input.to) {
    return {
      allowed: true,
      blockingCodes: [],
    };
  }

  const allowedTargets = TREINOS_V2_TEMPLATE_STATUS_TRANSITIONS[input.from];
  if (!allowedTargets.includes(input.to)) {
    return {
      allowed: false,
      blockingCodes: [],
      reason: "TRANSICAO_INVALIDA",
    };
  }

  if (input.to === "EM_REVISAO" && !(input.permissionSet.canSubmitForReview || input.permissionSet.canPublishTemplate)) {
    return {
      allowed: false,
      blockingCodes: [],
      reason: "SEM_PERMISSAO_PARA_REVISAO",
    };
  }

  if (input.to === "ARQUIVADO" && !input.permissionSet.canArchiveTemplate) {
    return {
      allowed: false,
      blockingCodes: [],
      reason: "SEM_PERMISSAO_PARA_ARQUIVAR",
    };
  }

  if (input.to === "RASCUNHO" && !(input.permissionSet.canEditOwnTemplate || input.permissionSet.canPublishTemplate)) {
    return {
      allowed: false,
      blockingCodes: [],
      reason: "SEM_PERMISSAO_PARA_EDITAR",
    };
  }

  if (input.to === "PUBLICADO") {
    if (!input.permissionSet.canPublishTemplate) {
      return {
        allowed: false,
        blockingCodes: [],
        reason: "SEM_PERMISSAO_PARA_PUBLICAR",
      };
    }

    const blockingIssues = validateTreinoV2Template(input.template)
      .filter((issue) => issue.severity === "ERROR")
      .map((issue) => issue.code);

    if (blockingIssues.length > 0) {
      return {
        allowed: false,
        blockingCodes: [...new Set(blockingIssues)],
        reason: "TEMPLATE_INVALIDO",
      };
    }
  }

  return {
    allowed: true,
    blockingCodes: [],
  };
}

export function resolveTreinoV2AssignmentConflict(input: {
  existingStatus?: TreinoV2AssignedStatus | null;
  policy: TreinoV2AssignmentConflictPolicy;
}): TreinoV2AssignmentResolution {
  const status = input.existingStatus;

  if (!status || status === "ENCERRADO" || status === "SUBSTITUIDO") {
    return "CRIAR";
  }

  if (input.policy === "MANTER_ATUAL") {
    return "IGNORAR";
  }

  if (input.policy === "SUBSTITUIR_ATUAL") {
    return "SUBSTITUIR";
  }

  return "AGENDAR";
}

export function isTreinoV2AssignmentJobTerminal(status: TreinoV2AssignmentJobStatus): boolean {
  return status === "CONCLUIDO" || status === "CONCLUIDO_PARCIAL" || status === "FALHOU" || status === "CANCELADO";
}
