import type {
  TreinoV2AssignedStatus,
  TreinoV2AssignmentConflictPolicy,
  TreinoV2AssignmentFilter,
  TreinoV2AssignmentJob,
  TreinoV2AssignmentMode,
  TreinoV2Block,
  TreinoV2DefaultObjective,
  TreinoV2ExerciseMediaType,
  TreinoV2ExerciseType,
  TreinoV2FinePermissionKey,
  TreinoV2PermissionSet,
  TreinoV2Template,
  TreinoV2TemplateSnapshot,
  TreinoV2TemplateStatus,
  TreinoV2ValidationIssue,
} from "@/lib/treinos/v2-domain";

export interface TreinoV2CatalogExercise {
  id: string;
  tenantId: string;
  nome: string;
  codigo?: string;
  grupoExercicioId?: string;
  grupoExercicioNome?: string;
  grupoMuscularId?: string;
  grupoMuscularNome?: string;
  tipo: TreinoV2ExerciseType;
  objetivoPadrao?: TreinoV2DefaultObjective;
  unidadeCarga?: string;
  descricao?: string;
  midiaTipo?: TreinoV2ExerciseMediaType;
  midiaUrl?: string;
  disponivelNoApp: boolean;
  similarExerciseIds: string[];
  ativo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const TREINOS_V2_ENDPOINTS = {
  listTemplates: "/api/v2/treinos/templates",
  createTemplate: "/api/v2/treinos/templates",
  getTemplate: "/api/v2/treinos/templates/:templateId",
  updateTemplate: "/api/v2/treinos/templates/:templateId",
  submitTemplateForReview: "/api/v2/treinos/templates/:templateId/review",
  publishTemplate: "/api/v2/treinos/templates/:templateId/publish",
  archiveTemplate: "/api/v2/treinos/templates/:templateId/archive",
  duplicateTemplate: "/api/v2/treinos/templates/:templateId/duplicate",
  listCatalogExercises: "/api/v2/treinos/catalog/exercicios",
  createCatalogExercise: "/api/v2/treinos/catalog/exercicios",
  updateCatalogExercise: "/api/v2/treinos/catalog/exercicios/:exerciseId",
  listAssignedWorkouts: "/api/v2/treinos/assigned",
  getAssignedWorkout: "/api/v2/treinos/assigned/:assignedWorkoutId",
  assignTemplate: "/api/v2/treinos/templates/:templateId/assignments",
  getAssignmentJob: "/api/v2/treinos/assignments/jobs/:jobId",
  listTemplateAssignments: "/api/v2/treinos/templates/:templateId/assignments",
} as const;

export type TreinoV2TemplateListSort = "UPDATED_AT_DESC" | "UPDATED_AT_ASC" | "NOME_ASC" | "CRIADO_POR_ASC";

export interface TreinoV2TemplateListQuery {
  tenantId: string;
  search?: string;
  page: number;
  size: number;
  status?: TreinoV2TemplateStatus[];
  createdById?: string;
  reviewOnly?: boolean;
  sort?: TreinoV2TemplateListSort;
}

export interface TreinoV2TemplateListItem {
  id: string;
  nome: string;
  createdByName?: string;
  status: TreinoV2TemplateStatus;
  precisaRevisao: boolean;
  versao: number;
  updatedAt: string;
  assignmentCount?: number;
}

export interface TreinoV2TemplateListResponse {
  items: TreinoV2TemplateListItem[];
  total: number;
  page: number;
  size: number;
  hasNext: boolean;
}

export interface UpsertTreinoV2TemplateRequest {
  tenantId: string;
  nome: string;
  frequenciaSemanal: number;
  totalSemanas: number;
  descricao?: string;
  categoria?: string;
  versaoSimplificadaHabilitada?: boolean;
  blocos: TreinoV2Block[];
}

export interface TreinoV2EditorResponse {
  template: TreinoV2Template;
  validationIssues: TreinoV2ValidationIssue[];
  allowedActions: Array<"SAVE_DRAFT" | "SUBMIT_REVIEW" | "PUBLISH" | "ARCHIVE" | "DUPLICATE" | "ASSIGN">;
  permissions: TreinoV2PermissionSet;
}

export interface TreinoV2CatalogExerciseListQuery {
  tenantId: string;
  search?: string;
  grupoExercicioIds?: string[];
  grupoMuscularIds?: string[];
  tipos?: TreinoV2ExerciseType[];
  objetivoPadrao?: TreinoV2DefaultObjective[];
  disponivelNoApp?: boolean;
  ativo?: boolean;
}

export interface UpsertTreinoV2CatalogExerciseRequest {
  tenantId: string;
  nome: string;
  codigo?: string;
  grupoExercicioId?: string;
  grupoMuscularId?: string;
  tipo: TreinoV2ExerciseType;
  objetivoPadrao?: TreinoV2DefaultObjective;
  unidadeCarga?: string;
  descricao?: string;
  midiaTipo?: TreinoV2ExerciseMediaType;
  midiaUrl?: string;
  disponivelNoApp: boolean;
  similarExerciseIds?: string[];
  ativo?: boolean;
}

export interface TreinoV2AssignmentRequest {
  tenantId: string;
  templateId: string;
  mode: TreinoV2AssignmentMode;
  conflictPolicy: TreinoV2AssignmentConflictPolicy;
  dataInicio: string;
  dataFim?: string;
  observacao?: string;
  professorResponsavelId?: string;
  targets: Array<{
    alunoId: string;
  }>;
  filtro?: TreinoV2AssignmentFilter;
}

export interface TreinoV2AssignmentResponse {
  job: TreinoV2AssignmentJob;
}

export interface TreinoV2TemplateAssignmentHistoryItem {
  jobId: string;
  templateId: string;
  templateVersion: number;
  mode: TreinoV2AssignmentMode;
  conflictPolicy: TreinoV2AssignmentConflictPolicy;
  requestedByName?: string;
  requestedAt: string;
  totalSelecionado: number;
  totalAtribuido: number;
  totalIgnorado: number;
  totalComErro: number;
}

export interface TreinoV2AssignedWorkoutListQuery {
  tenantId: string;
  alunoId?: string;
  professorResponsavelId?: string;
  status?: TreinoV2AssignedStatus[];
  origemTemplateId?: string;
  unidadeId?: string;
  vigenciaInicio?: string;
  vigenciaFim?: string;
  page: number;
  size: number;
}

export interface TreinoV2AssignedWorkoutListItem {
  id: string;
  alunoId: string;
  alunoNome: string;
  professorResponsavelNome?: string;
  status: TreinoV2AssignedStatus;
  dataInicio: string;
  dataFim?: string;
  origem: "TEMPLATE" | "MANUAL" | "MASSA" | "REUTILIZACAO" | "RENOVACAO";
  templateOrigemId?: string;
  templateOrigemNome?: string;
  templateVersion?: number;
  snapshotId: string;
}

export interface TreinoV2AssignedWorkoutListResponse {
  items: TreinoV2AssignedWorkoutListItem[];
  total: number;
  page: number;
  size: number;
  hasNext: boolean;
}

export interface PublishTreinoV2TemplateRequest {
  tenantId: string;
  expectedVersion: number;
}

export interface TreinoV2TemplatePublishResponse {
  templateId: string;
  status: TreinoV2TemplateStatus;
  versao: number;
  publishedAt: string;
  publishedById?: string;
  snapshot?: TreinoV2TemplateSnapshot;
}

export interface TreinoV2PermissionContextResponse {
  tenantId: string;
  permissions: TreinoV2PermissionSet;
  finePermissions: TreinoV2FinePermissionKey[];
}
