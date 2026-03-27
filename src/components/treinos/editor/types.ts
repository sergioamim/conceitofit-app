import type { Dispatch, SetStateAction } from "react";
import type { TreinoV2CatalogExercise } from "@/lib/api/treinos-v2";
import type {
  TreinoV2AssignmentConflictPolicy,
  TreinoV2DefaultObjective,
  TreinoV2ExerciseType,
  TreinoV2TechniqueType,
} from "@/lib/treinos/v2-domain";
import type { TreinoV2EditorSeed } from "@/lib/treinos/v2-runtime";
import type { Aluno, Exercicio, Treino } from "@/lib/types";

export const OBJECTIVE_OPTIONS: TreinoV2DefaultObjective[] = [
  "HIPERTROFIA",
  "FORCA",
  "RESISTENCIA",
  "MOBILIDADE",
  "EMAGRECIMENTO",
  "REABILITACAO",
  "CONDICIONAMENTO",
  "OUTRO",
];

export const EXERCISE_TYPE_OPTIONS: TreinoV2ExerciseType[] = [
  "MUSCULACAO",
  "CARDIO",
  "MOBILIDADE",
  "ALONGAMENTO",
  "FUNCIONAL",
  "OUTRO",
];

export const TECHNIQUE_OPTIONS: Array<{ label: string; value: TreinoV2TechniqueType }> = [
  { label: "Conjugado", value: "CONJUGADO" },
  { label: "Progressivo", value: "PROGRESSIVO" },
  { label: "Drop-set", value: "DROP_SET" },
  { label: "Replicar série", value: "REPLICAR_SERIE" },
];

export type EditorProps = {
  tenantId: string;
  treino: Treino;
  alunos: Aluno[];
  exercicios: Exercicio[];
  role: "PROFESSOR" | "COORDENADOR_TECNICO" | "ADMINISTRADOR" | "OPERACAO";
  finePermissions?: Array<
    | "EXERCICIOS"
    | "TREINO_PADRAO"
    | "TREINO_PADRAO_PRESCREVER"
    | "TREINOS_PRESCREVER"
    | "TREINOS_PRESCREVER_OUTRAS_CARTEIRAS"
    | "TREINOS_PERSONALIZAR_EXERCICIO"
    | "TREINOS_SOMENTE_EDITAR_CARGA"
    | "TREINOS_CONSULTAR_OUTRAS_CARTEIRAS"
    | "TREINO_EXIBIR_QTD_RESULTADOS"
  >;
  autoOpenAssignment?: boolean;
  onTreinoChange: (treino: Treino) => void;
  onCatalogChange?: (exercicios: Exercicio[]) => void;
};

export type ExerciseDrawerState = {
  open: boolean;
  editingId?: string;
  nome: string;
  codigo: string;
  grupoExercicioNome: string;
  grupoMuscularId: string;
  tipo: TreinoV2ExerciseType;
  objetivoPadrao: TreinoV2DefaultObjective | "";
  unidadeCarga: string;
  descricao: string;
  midiaTipo: "IMAGEM" | "GIF" | "VIDEO" | "";
  midiaUrl: string;
  disponivelNoApp: boolean;
  similarExerciseIds: string[];
};

export type AssignmentDialogState = {
  open: boolean;
  tab: "INDIVIDUAL" | "MASSA" | "SEGMENTO";
  alunoId: string;
  selectedAlunoIds: string[];
  dataInicio: string;
  dataFim: string;
  professorResponsavel: string;
  observacao: string;
  conflictPolicy: TreinoV2AssignmentConflictPolicy;
  selectionSearch: string;
  processing: boolean;
  progressLabel?: string;
};

export type GrupoMuscularOption = {
  id: string;
  nome: string;
};

export function cloneEditor(editor: TreinoV2EditorSeed): TreinoV2EditorSeed {
  return JSON.parse(JSON.stringify(editor)) as TreinoV2EditorSeed;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(base: string, days: number): string {
  const date = new Date(`${base}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function formatDateTime(value?: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR");
}

export function formatDateRange(start?: string, end?: string): string {
  if (!start && !end) return "-";
  if (!end) return formatDateTime(start);
  return `${formatDateTime(start)} até ${formatDateTime(end)}`;
}

export function buildExerciseDrawerState(exercicio?: TreinoV2CatalogExercise): ExerciseDrawerState {
  return {
    open: Boolean(exercicio),
    editingId: exercicio?.id,
    nome: exercicio?.nome ?? "",
    codigo: exercicio?.codigo ?? "",
    grupoExercicioNome: exercicio?.grupoExercicioNome ?? "",
    grupoMuscularId: exercicio?.grupoMuscularId ?? "",
    tipo: exercicio?.tipo ?? "MUSCULACAO",
    objetivoPadrao: exercicio?.objetivoPadrao ?? "",
    unidadeCarga: exercicio?.unidadeCarga ?? "",
    descricao: exercicio?.descricao ?? "",
    midiaTipo: exercicio?.midiaTipo ?? "",
    midiaUrl: exercicio?.midiaUrl ?? "",
    disponivelNoApp: exercicio?.disponivelNoApp ?? true,
    similarExerciseIds: exercicio?.similarExerciseIds ?? [],
  };
}

export function buildAssignmentDialogState(treino: Treino): AssignmentDialogState {
  const start = treino.dataInicio ?? todayIso();
  return {
    open: false,
    tab: "INDIVIDUAL",
    alunoId: "",
    selectedAlunoIds: [],
    dataInicio: start,
    dataFim: treino.dataFim ?? addDays(start, 28),
    professorResponsavel: treino.funcionarioNome ?? "",
    observacao: "",
    conflictPolicy: "MANTER_ATUAL",
    selectionSearch: "",
    processing: false,
  };
}

export function getTemplateStatusBadgeVariant(status: string) {
  if (status === "ARQUIVADO") return "destructive" as const;
  if (status === "EM_REVISAO") return "outline" as const;
  if (status === "RASCUNHO") return "outline" as const;
  return "secondary" as const;
}

export function getAssignedStatusBadgeVariant(status: TreinoV2EditorSeed["assignedStatus"]) {
  if (status === "ENCERRADO" || status === "SUBSTITUIDO") return "destructive" as const;
  if (status === "AGENDADO") return "outline" as const;
  return "secondary" as const;
}

export function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) return items;
  const clone = [...items];
  const [item] = clone.splice(index, 1);
  clone.splice(nextIndex, 0, item);
  return clone;
}

export function buildNewExerciseItem(exercicio?: TreinoV2CatalogExercise, ordem = 1) {
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    exerciseId: exercicio?.id,
    exerciseNome: exercicio?.nome ?? "",
    ordem,
    objetivo: exercicio?.objetivoPadrao ?? "",
    unidadeCarga: exercicio?.unidadeCarga ?? "",
    regulagem: "",
    observacoes: "",
    series: { raw: "3", numericValue: 3, status: "VALIDO" as const },
    repeticoes: { raw: "10", numericValue: 10, status: "VALIDO" as const },
    carga: undefined,
    intervalo: { raw: "45", numericValue: 45, status: "VALIDO" as const },
    tecnicas: [],
  };
}

export function downloadEditorSnapshot(treinoId: string, editor: TreinoV2EditorSeed) {
  const blob = new Blob([JSON.stringify(editor, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${treinoId}-editor-v2.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
